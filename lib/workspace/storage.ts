import { BeginnerIssue } from "../github/search";
import { UserPreferencesData } from "../recommendations/matcher";

export interface ClientTrackedIssue {
  id: string;
  issueNumber: number;
  repoOwner: string;
  repoName: string;
  title: string;
  htmlUrl: string;
  state: "open" | "closed";
  status: "saved" | "interested" | "in_progress" | "completed";
  notes?: string | null;
  labels: string[];
  language?: string | null;
  difficulty?: string | null;
  prUrl?: string | null;
  isPrConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY = "issuepilot_tracked_issues_v1";
const PREFS_STORAGE_KEY = "issuepilot_user_preferences_v1";
const RECENT_STORAGE_KEY = "issuepilot_recent_views_v1";

export async function fetchTrackedIssues(): Promise<ClientTrackedIssue[]> {
  try {
    const res = await fetch("/api/workspace");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.trackedIssues)) {
        const formatted: ClientTrackedIssue[] = data.trackedIssues.map((item: any) => ({
          ...item,
          labels: typeof item.labels === "string" ? JSON.parse(item.labels || "[]") : item.labels || [],
        }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formatted));
        return formatted;
      }
    }
  } catch {
    // Fallback to local storage if offline or server error
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return [];
}

export async function trackIssue(
  issue: BeginnerIssue,
  status: "saved" | "interested" | "in_progress" | "completed" = "saved",
  notes?: string
): Promise<ClientTrackedIssue> {
  const payload = {
    issueNumber: issue.number,
    repoOwner: issue.repository.owner,
    repoName: issue.repository.name,
    title: issue.title,
    htmlUrl: issue.htmlUrl,
    state: issue.state,
    status,
    notes: notes || null,
    labels: JSON.stringify(issue.labels.map((l) => l.name)),
    language: issue.repository.language || null,
    difficulty: issue.difficulty || null,
  };

  let savedItem: ClientTrackedIssue = {
    id: `local_${issue.repository.owner}_${issue.repository.name}_${issue.number}`,
    issueNumber: issue.number,
    repoOwner: issue.repository.owner,
    repoName: issue.repository.name,
    title: issue.title,
    htmlUrl: issue.htmlUrl,
    state: issue.state,
    status,
    notes: notes || null,
    labels: issue.labels.map((l) => l.name),
    language: issue.repository.language || null,
    difficulty: issue.difficulty || null,
    prUrl: null,
    isPrConfirmed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.item) {
        savedItem = {
          ...json.item,
          labels: typeof json.item.labels === "string" ? JSON.parse(json.item.labels || "[]") : json.item.labels,
        };
      }
    }
  } catch {}

  // Update local cache
  const existing = await fetchTrackedIssues();
  const filtered = existing.filter(
    (i) => !(i.repoOwner === issue.repository.owner && i.repoName === issue.repository.name && i.issueNumber === issue.number)
  );
  const updated = [savedItem, ...filtered];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  return savedItem;
}

export async function updateTrackedIssueStatus(
  id: string,
  status: "saved" | "interested" | "in_progress" | "completed",
  notes?: string,
  prUrl?: string
): Promise<boolean> {
  try {
    await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, notes, prUrl }),
    });
  } catch {}

  const existing = await fetchTrackedIssues();
  const updated = existing.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        notes: notes !== undefined ? notes : item.notes,
        prUrl: prUrl !== undefined ? prUrl : item.prUrl,
        isPrConfirmed: Boolean(prUrl && /github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test(prUrl)),
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return true;
}

export async function removeTrackedIssue(id: string): Promise<boolean> {
  try {
    await fetch(`/api/workspace?id=${id}`, { method: "DELETE" });
  } catch {}

  const existing = await fetchTrackedIssues();
  const updated = existing.filter((i) => i.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return true;
}

export async function fetchUserPreferences(): Promise<UserPreferencesData> {
  const defaultPrefs: UserPreferencesData = {
    languages: ["TypeScript", "JavaScript", "Python"],
    experienceLevel: "beginner",
    topics: ["web", "react", "tools"],
    monthlyGoal: 3,
  };

  try {
    const res = await fetch("/api/workspace/preferences");
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch {}

  const local = localStorage.getItem(PREFS_STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }

  return defaultPrefs;
}

export async function saveUserPreferences(prefs: UserPreferencesData): Promise<boolean> {
  try {
    await fetch("/api/workspace/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
  } catch {}

  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  return true;
}
