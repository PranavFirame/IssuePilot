import { GitHubApiError } from "./client";

export interface SearchFilters {
  query?: string;
  language?: string;
  difficulty?: string; // "good first issue", "help wanted", "documentation", "all"
  sort?: "updated" | "comments" | "created" | "stars";
  order?: "desc" | "asc";
  page?: number;
  perPage?: number;
}

export interface BeginnerIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  htmlUrl: string;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    login: string;
    avatarUrl: string;
  };
  repository: {
    owner: string;
    name: string;
    fullName: string;
    htmlUrl: string;
    avatarUrl: string;
    stars?: number;
    language?: string;
  };
  labels: {
    id: number;
    name: string;
    color: string;
  }[];
  difficulty: "good first issue" | "help wanted" | "documentation" | "beginner" | "general";
  ageInDays: number;
  freshness: "recent" | "moderate" | "stale";
}

export interface SearchIssuesResponse {
  totalCount: number;
  incompleteResults: boolean;
  issues: BeginnerIssue[];
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
}

const searchCache = new Map<string, { timestamp: number; data: SearchIssuesResponse }>();
const SEARCH_CACHE_TTL_MS = 90 * 1000; // 90 seconds cache to protect Search API rate limits

export function buildSearchQuery(filters: SearchFilters): string {
  const parts: string[] = ["is:issue", "is:open"];

  // Difficulty / Label
  if (filters.difficulty && filters.difficulty !== "all") {
    parts.push(`label:"${filters.difficulty}"`);
  } else {
    // Default beginner tags
    parts.push(
      '(label:"good first issue" OR label:"help wanted" OR label:"beginner" OR label:"easy" OR label:"first-timers-only" OR label:"documentation")'
    );
  }

  // Language
  if (filters.language && filters.language !== "all") {
    parts.push(`language:"${filters.language.trim()}"`);
  }

  // Text search query
  if (filters.query && filters.query.trim()) {
    // Clean dangerous characters
    const sanitized = filters.query.trim().replace(/["\\]/g, "");
    if (sanitized) {
      parts.push(sanitized);
    }
  }

  // Only consider repos with some traction to avoid spam
  parts.push("stars:>10");

  return parts.join(" ");
}

export async function searchBeginnerIssues(
  filters: SearchFilters = {},
  token?: string
): Promise<SearchIssuesResponse> {
  const q = buildSearchQuery(filters);
  const page = Math.max(1, filters.page || 1);
  const perPage = Math.min(50, Math.max(10, filters.perPage || 20));

  let sortParam = "updated";
  let orderParam = filters.order || "desc";

  if (filters.sort === "comments") sortParam = "comments";
  else if (filters.sort === "created") sortParam = "created";
  else if (filters.sort === "updated") sortParam = "updated";

  const cacheKey = `${q}__sort:${sortParam}__order:${orderParam}__page:${page}__perPage:${perPage}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = new URL("https://api.github.com/search/issues");
  url.searchParams.set("q", q);
  url.searchParams.set("sort", sortParam);
  url.searchParams.set("order", orderParam);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "IssuePilot-App/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const authToken = token || process.env.GITHUB_TOKEN;
  if (authToken && authToken.trim()) {
    headers.Authorization = `Bearer ${authToken.trim()}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url.toString(), {
      headers,
      signal: controller.signal,
    });

    const limit = parseInt(res.headers.get("x-ratelimit-limit") || "10", 10);
    const remaining = parseInt(res.headers.get("x-ratelimit-remaining") || "10", 10);
    const resetTime = res.headers.get("x-ratelimit-reset");
    const resetDate = resetTime
      ? new Date(parseInt(resetTime, 10) * 1000).toISOString()
      : new Date(Date.now() + 60000).toISOString();

    if (!res.ok) {
      if (res.status === 403 && remaining === 0) {
        throw new GitHubApiError(
          `GitHub Search API rate limit exceeded. Resets at ${new Date(
            resetDate
          ).toLocaleTimeString()}. Add a GITHUB_TOKEN to raise your limit.`,
          403,
          true,
          resetDate
        );
      }

      const text = await res.text();
      throw new GitHubApiError(`GitHub Search API error (${res.status}): ${text.slice(0, 150)}`, res.status);
    }

    const json = await res.json();
    const now = new Date();

    const normalizedIssues: BeginnerIssue[] = (json.items || []).map((item: any) => {
      // Parse repo owner and name from repository_url: "https://api.github.com/repos/owner/repo"
      let owner = "unknown";
      let name = "unknown";
      if (item.repository_url) {
        const parts = item.repository_url.split("/repos/")[1]?.split("/");
        if (parts && parts.length >= 2) {
          owner = parts[0];
          name = parts[1];
        }
      }

      const createdAt = new Date(item.created_at);
      const updatedAt = new Date(item.updated_at);
      const ageInDays = Math.max(
        0,
        Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      );
      const daysSinceUpdate = Math.max(
        0,
        Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      );

      let freshness: "recent" | "moderate" | "stale" = "recent";
      if (daysSinceUpdate > 90) freshness = "stale";
      else if (daysSinceUpdate > 30) freshness = "moderate";

      // Detect primary difficulty tag
      const labelNames = (item.labels || []).map((l: any) => l.name.toLowerCase());
      let difficulty: BeginnerIssue["difficulty"] = "general";
      if (labelNames.some((l: string) => l.includes("good first issue") || l.includes("first-timers-only"))) {
        difficulty = "good first issue";
      } else if (labelNames.some((l: string) => l.includes("help wanted") || l.includes("up-for-grabs"))) {
        difficulty = "help wanted";
      } else if (labelNames.some((l: string) => l.includes("documentation") || l.includes("docs"))) {
        difficulty = "documentation";
      } else if (labelNames.some((l: string) => l.includes("easy") || l.includes("beginner"))) {
        difficulty = "beginner";
      }

      return {
        id: item.id,
        number: item.number,
        title: item.title,
        body: item.body || "",
        state: item.state,
        htmlUrl: item.html_url,
        commentsCount: item.comments || 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        author: {
          login: item.user?.login || "ghost",
          avatarUrl: item.user?.avatar_url || "https://github.com/ghost.png",
        },
        repository: {
          owner,
          name,
          fullName: `${owner}/${name}`,
          htmlUrl: `https://github.com/${owner}/${name}`,
          avatarUrl: `https://github.com/${owner}.png`,
          language: filters.language !== "all" ? filters.language : undefined,
        },
        labels: (item.labels || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          color: l.color,
        })),
        difficulty,
        ageInDays,
        freshness,
      };
    });

    const result: SearchIssuesResponse = {
      totalCount: json.total_count || 0,
      incompleteResults: Boolean(json.incomplete_results),
      issues: normalizedIssues,
      rateLimit: {
        limit,
        remaining,
        resetAt: resetDate,
      },
    };

    searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err: unknown) {
    if (err instanceof GitHubApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new GitHubApiError("GitHub search request timed out.", 504);
    }
    throw new GitHubApiError(
      `Search API communication failed: ${err instanceof Error ? err.message : String(err)}`,
      500
    );
  } finally {
    clearTimeout(timeout);
  }
}
