import { describe, expect, it } from "vitest";
import { generateIssuesCsv, generateRepositoryMarkdownReport } from "../../lib/export/formatters";
import { NormalizedIssue, RepositoryAnalysisPayload } from "../../lib/github/types";

describe("Export formatters", () => {
  const mockIssues: NormalizedIssue[] = [
    {
      id: 1,
      number: 101,
      title: 'Issue with "quotes" and, commas',
      body: "Sample body",
      state: "open",
      author: { login: "alice", avatarUrl: "" },
      labels: [{ id: 1, name: "bug", color: "ff0000" }],
      commentsCount: 4,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
      closedAt: null,
      htmlUrl: "https://github.com/org/repo/issues/101",
      isPullRequest: false,
      ageInDays: 12,
      isStale: false,
    },
  ];

  it("generates properly escaped RFC 4180 CSV", () => {
    const csv = generateIssuesCsv(mockIssues, "org/repo");
    expect(csv).toContain("Repository,Issue Number,Title,State");
    expect(csv).toContain('"org/repo"');
    expect(csv).toContain('"Issue with ""quotes"" and, commas"');
    expect(csv).toContain('"open"');
    expect(csv).toContain('"alice"');
    expect(csv).toContain('"bug"');
  });

  it("generates markdown summary report with all sections", () => {
    const mockPayload: RepositoryAnalysisPayload = {
      repository: {
        owner: "org",
        repo: "repo",
        fullName: "org/repo",
        description: "A great repo",
        htmlUrl: "https://github.com/org/repo",
        stars: 500,
        forks: 100,
        openIssuesCount: 1,
        openPrCount: 2,
        closedPrCount: 20,
        language: "TypeScript",
        license: "MIT",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        pushedAt: "2026-01-01T00:00:00Z",
        defaultBranch: "main",
        isArchived: false,
        contributors: [],
      },
      health: {
        score: 88,
        grade: "A",
        breakdown: {
          activityScore: 25,
          issueHealthScore: 20,
          prVelocityScore: 23,
          stalenessScore: 20,
        },
        staleIssuesCount: 0,
        staleIssuesRatio: 0,
        averageIssueAgeDays: 12,
        medianIssueAgeDays: 12,
      },
      issues: mockIssues,
      labelsDistribution: [{ name: "bug", color: "ff0000", count: 1 }],
      activityTimeline: [],
      rateLimit: {
        limit: 60,
        remaining: 55,
        resetAt: new Date().toISOString(),
        isApproachingLimit: false,
      },
    };

    const md = generateRepositoryMarkdownReport(mockPayload);
    expect(md).toContain("# IssuePilot Intelligence Report: org/repo");
    expect(md).toContain("88/100");
    expect(md).toContain("Grade A");
    expect(md).toContain("TypeScript");
    expect(md).toContain("Maintenance Recommendations");
  });
});
