import { describe, expect, it } from "vitest";
import { calculateRepositoryHealth } from "../../lib/metrics/health-score";
import { NormalizedIssue, RepositorySummary } from "../../lib/github/types";

describe("calculateRepositoryHealth", () => {
  const mockRepo: RepositorySummary = {
    owner: "test-owner",
    repo: "test-repo",
    fullName: "test-owner/test-repo",
    description: "Sample repo",
    htmlUrl: "https://github.com/test-owner/test-repo",
    stars: 1200,
    forks: 300,
    openIssuesCount: 10,
    openPrCount: 2,
    closedPrCount: 40,
    language: "TypeScript",
    license: "MIT",
    createdAt: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    pushedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
    defaultBranch: "main",
    isArchived: false,
    contributors: [],
  };

  it("calculates high health score for active, well-maintained repository", () => {
    const issues: NormalizedIssue[] = [
      {
        id: 1,
        number: 1,
        title: "Recent open issue",
        body: "body",
        state: "open",
        author: { login: "alice", avatarUrl: "" },
        labels: [],
        commentsCount: 3,
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        closedAt: null,
        htmlUrl: "https://github.com/test-owner/test-repo/issues/1",
        isPullRequest: false,
        ageInDays: 10,
        isStale: false,
      },
      {
        id: 2,
        number: 2,
        title: "Recently closed issue",
        body: "body",
        state: "closed",
        author: { login: "bob", avatarUrl: "" },
        labels: [],
        commentsCount: 5,
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        htmlUrl: "https://github.com/test-owner/test-repo/issues/2",
        isPullRequest: false,
        ageInDays: 15,
        isStale: false,
      },
    ];

    const result = calculateRepositoryHealth(mockRepo, issues);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(["A+", "A"]).toContain(result.grade);
    expect(result.staleIssuesCount).toBe(0);
    expect(result.staleIssuesRatio).toBe(0);
  });

  it("detects stale issues and lowers score appropriately", () => {
    const staleIssues: NormalizedIssue[] = Array.from({ length: 5 }, (_, idx) => ({
      id: idx + 1,
      number: idx + 1,
      title: `Old unaddressed bug ${idx + 1}`,
      body: "body",
      state: "open",
      author: { login: "dev", avatarUrl: "" },
      labels: [],
      commentsCount: 0,
      createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
      closedAt: null,
      htmlUrl: `https://github.com/test-owner/test-repo/issues/${idx + 1}`,
      isPullRequest: false,
      ageInDays: 120,
      isStale: true,
    }));

    const inactiveRepo = {
      ...mockRepo,
      pushedAt: new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString(), // 200 days ago
      openPrCount: 20,
      closedPrCount: 2,
    };

    const result = calculateRepositoryHealth(inactiveRepo, staleIssues);
    expect(result.staleIssuesCount).toBe(5);
    expect(result.staleIssuesRatio).toBe(1.0);
    expect(result.score).toBeLessThan(60);
    expect(["D", "F"]).toContain(result.grade);
  });
});
