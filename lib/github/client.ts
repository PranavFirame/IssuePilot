import {
  GitHubContributorItem,
  GitHubIssueItem,
  GitHubPullRequestItem,
  GitHubRepoResponse,
  NormalizedIssue,
  RepositoryAnalysisPayload,
  RepositorySummary,
} from "./types";
import { calculateRepositoryHealth } from "../metrics/health-score";
import { parseRepositoryUrl } from "./url-parser";

interface CacheEntry {
  timestamp: number;
  data: RepositoryAnalysisPayload;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const memoryCache = new Map<string, CacheEntry>();

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRateLimit: boolean = false,
    public resetAt?: string
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export interface FetchOptions {
  bypassCache?: boolean;
}

/**
 * Centralized GitHub API Client.
 * Hardened against SSRF, tracks rate limits, and normalizes repository data.
 */
export class GitHubClient {
  private token?: string;
  private baseUrl = "https://api.github.com";

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "IssuePilot-App/1.0",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (this.token && this.token.trim().length > 0) {
      headers.Authorization = `Bearer ${this.token.trim()}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    timeoutMs: number = 10000
  ): Promise<{ data: T; headers: Headers }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      const remaining = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");
      const resetDate = resetTime
        ? new Date(parseInt(resetTime, 10) * 1000).toISOString()
        : undefined;

      if (!response.ok) {
        if (response.status === 403 && remaining === "0") {
          throw new GitHubApiError(
            `GitHub API rate limit exceeded. Resets at ${resetDate || "soon"}. Add a GITHUB_TOKEN to raise your limit to 5,000 requests/hour.`,
            403,
            true,
            resetDate
          );
        }

        if (response.status === 404) {
          throw new GitHubApiError(
            "Repository not found or is private. Please verify the owner and repository name.",
            404
          );
        }

        const errText = await response.text();
        throw new GitHubApiError(
          `GitHub API error (${response.status}): ${errText.slice(0, 200)}`,
          response.status
        );
      }

      const data = (await response.json()) as T;
      return { data, headers: response.headers };
    } catch (err: unknown) {
      if (err instanceof GitHubApiError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new GitHubApiError("GitHub API request timed out after 10 seconds.", 504);
      }
      throw new GitHubApiError(
        `Failed to communicate with GitHub API: ${err instanceof Error ? err.message : String(err)}`,
        500
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Fetches full repository intelligence and computes normalized metrics.
   */
  async analyzeRepository(
    owner: string,
    repo: string,
    options: FetchOptions = {}
  ): Promise<RepositoryAnalysisPayload> {
    const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

    if (!options.bypassCache) {
      const cached = memoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    // Parallel fetch: Repo details, Open Issues & PRs, Closed PRs sample, Contributors
    const [repoResult, openIssuesResult, closedIssuesResult, closedPrsResult, contributorsResult] =
      await Promise.all([
        this.request<GitHubRepoResponse>(`/repos/${owner}/${repo}`),
        this.request<GitHubIssueItem[]>(
          `/repos/${owner}/${repo}/issues?state=open&per_page=100&sort=updated&direction=desc`
        ),
        this.request<GitHubIssueItem[]>(
          `/repos/${owner}/${repo}/issues?state=closed&per_page=50&sort=updated&direction=desc`
        ),
        this.request<GitHubPullRequestItem[]>(
          `/repos/${owner}/${repo}/pulls?state=closed&per_page=50`
        ),
        this.request<GitHubContributorItem[]>(
          `/repos/${owner}/${repo}/contributors?per_page=10`
        ).catch(() => ({ data: [] as GitHubContributorItem[], headers: new Headers() })),
      ]);

    const repoData = repoResult.data;
    const rateLimitLimit = parseInt(repoResult.headers.get("x-ratelimit-limit") || "60", 10);
    const rateLimitRemaining = parseInt(
      repoResult.headers.get("x-ratelimit-remaining") || "60",
      10
    );
    const rateLimitResetUnix = parseInt(
      repoResult.headers.get("x-ratelimit-reset") || "0",
      10
    );
    const resetAt = rateLimitResetUnix
      ? new Date(rateLimitResetUnix * 1000).toISOString()
      : new Date(Date.now() + 3600000).toISOString();

    // Separate issues from PRs
    const allFetched = [...openIssuesResult.data, ...closedIssuesResult.data];
    const now = new Date();

    const normalizedIssues: NormalizedIssue[] = allFetched.map((item) => {
      const createdAt = new Date(item.created_at);
      const ageInDays = Math.max(
        0,
        Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      );
      const isPullRequest = Boolean(item.pull_request);
      const isStale = item.state === "open" && !isPullRequest && ageInDays > 90;

      return {
        id: item.id,
        number: item.number,
        title: item.title,
        body: item.body || "",
        state: item.state,
        author: {
          login: item.user.login,
          avatarUrl: item.user.avatar_url,
        },
        labels: item.labels.map((l) => ({
          id: l.id,
          name: l.name,
          color: l.color,
        })),
        commentsCount: item.comments,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        closedAt: item.closed_at,
        htmlUrl: item.html_url,
        isPullRequest,
        ageInDays,
        isStale,
      };
    });

    // Count open PRs vs open pure issues
    const openPrsCount = openIssuesResult.data.filter((i) => Boolean(i.pull_request)).length;
    const pureOpenIssuesCount = Math.max(0, repoData.open_issues_count - openPrsCount);

    const repositorySummary: RepositorySummary = {
      owner: repoData.owner.login,
      repo: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      htmlUrl: repoData.html_url,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssuesCount: pureOpenIssuesCount,
      openPrCount: openPrsCount,
      closedPrCount: closedPrsResult.data.length,
      language: repoData.language,
      license: repoData.license?.name || null,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      pushedAt: repoData.pushed_at,
      defaultBranch: repoData.default_branch,
      isArchived: repoData.archived,
      contributors: contributorsResult.data.map((c) => ({
        login: c.login,
        avatarUrl: c.avatar_url,
        contributions: c.contributions,
      })),
    };

    // Calculate health metrics
    const health = calculateRepositoryHealth(repositorySummary, normalizedIssues);

    // Compute label distribution
    const labelCounts = new Map<string, { color: string; count: number }>();
    for (const issue of normalizedIssues) {
      for (const label of issue.labels) {
        const existing = labelCounts.get(label.name);
        if (existing) {
          existing.count++;
        } else {
          labelCounts.set(label.name, { color: label.color, count: 1 });
        }
      }
    }

    const labelsDistribution = Array.from(labelCounts.entries())
      .map(([name, val]) => ({ name, color: val.color, count: val.count }))
      .sort((a, b) => b.count - a.count);

    // Activity timeline (daily grouping over recent items)
    const timelineMap = new Map<string, { created: number; closed: number }>();
    for (const issue of normalizedIssues) {
      const createdDay = issue.createdAt.slice(0, 10);
      const curr = timelineMap.get(createdDay) || { created: 0, closed: 0 };
      curr.created++;
      timelineMap.set(createdDay, curr);

      if (issue.closedAt) {
        const closedDay = issue.closedAt.slice(0, 10);
        const currClosed = timelineMap.get(closedDay) || { created: 0, closed: 0 };
        currClosed.closed++;
        timelineMap.set(closedDay, currClosed);
      }
    }

    const activityTimeline = Array.from(timelineMap.entries())
      .map(([date, counts]) => ({
        date,
        createdCount: counts.created,
        closedCount: counts.closed,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 activity data points

    const payload: RepositoryAnalysisPayload = {
      repository: repositorySummary,
      health,
      issues: normalizedIssues,
      labelsDistribution,
      activityTimeline,
      rateLimit: {
        limit: rateLimitLimit,
        remaining: rateLimitRemaining,
        resetAt,
        isApproachingLimit: rateLimitRemaining <= 10,
      },
    };

    memoryCache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return payload;
  }
}
