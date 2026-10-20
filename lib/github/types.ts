export interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  archived: boolean;
  disabled: boolean;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
}

export interface GitHubIssueLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubIssueItem {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  labels: GitHubIssueLabel[];
  state: "open" | "closed";
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  body: string | null;
  html_url: string;
  pull_request?: {
    url: string;
    html_url: string;
  };
}

export interface GitHubPullRequestItem {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubContributorItem {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface RepositorySummary {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  forks: number;
  openIssuesCount: number;
  openPrCount: number;
  closedPrCount: number;
  language: string | null;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  defaultBranch: string;
  isArchived: boolean;
  contributors: {
    login: string;
    avatarUrl: string;
    contributions: number;
  }[];
}

export interface RepositoryAnalysisPayload {
  repository: RepositorySummary;
  health: {
    score: number;
    grade: "A+" | "A" | "B" | "C" | "D" | "F";
    breakdown: {
      activityScore: number;
      issueHealthScore: number;
      prVelocityScore: number;
      stalenessScore: number;
    };
    staleIssuesCount: number;
    staleIssuesRatio: number;
    averageIssueAgeDays: number;
    medianIssueAgeDays: number;
  };
  issues: NormalizedIssue[];
  labelsDistribution: { name: string; color: string; count: number }[];
  activityTimeline: { date: string; createdCount: number; closedCount: number }[];
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: string;
    isApproachingLimit: boolean;
  };
}

export interface NormalizedIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  author: {
    login: string;
    avatarUrl: string;
  };
  labels: {
    id: number;
    name: string;
    color: string;
  }[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  htmlUrl: string;
  isPullRequest: boolean;
  ageInDays: number;
  isStale: boolean;
}
