import { describe, expect, it } from "vitest";
import { parseRepositoryUrl } from "../../lib/github/url-parser";
import { calculateRepositoryHealth } from "../../lib/metrics/health-score";
import { findPotentialDuplicates } from "../../lib/triage/duplicates";
import { generateIssuesCsv, generateRepositoryMarkdownReport } from "../../lib/export/formatters";
import { NormalizedIssue, RepositoryAnalysisPayload, RepositorySummary } from "../../lib/github/types";
import { prisma } from "../../lib/db/prisma";

describe("E2E User Journey & Pipeline Integration", () => {
  it("executes the full IssuePilot intelligence workflow", async () => {
    // 1. User inputs repository identifier
    const userInput = "https://github.com/facebook/react.git/";
    const parsed = parseRepositoryUrl(userInput);
    expect(parsed.isValid).toBe(true);
    expect(parsed.data?.owner).toBe("facebook");
    expect(parsed.data?.repo).toBe("react");

    // 2. Mock normalized data representing upstream GitHub API responses
    const mockRepo: RepositorySummary = {
      owner: "facebook",
      repo: "react",
      fullName: "facebook/react",
      description: "The library for web and native user interfaces.",
      htmlUrl: "https://github.com/facebook/react",
      stars: 230000,
      forks: 46000,
      openIssuesCount: 450,
      openPrCount: 80,
      closedPrCount: 12000,
      language: "JavaScript",
      license: "MIT",
      createdAt: "2013-05-24T16:15:54Z",
      updatedAt: new Date().toISOString(),
      pushedAt: new Date().toISOString(),
      defaultBranch: "main",
      isArchived: false,
      contributors: [
        { login: "gaearon", avatarUrl: "", contributions: 1800 },
        { login: "sophiebits", avatarUrl: "", contributions: 900 },
      ],
    };

    const mockIssues: NormalizedIssue[] = [
      {
        id: 1,
        number: 1001,
        title: "useTransition does not yield when parent re-renders rapidly",
        body: "Under high frequency state dispatches, useTransition starvation occurs in concurrent mode.",
        state: "open",
        author: { login: "contributor1", avatarUrl: "" },
        labels: [{ id: 10, name: "Component: Concurrent", color: "b60205" }],
        commentsCount: 6,
        createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        closedAt: null,
        htmlUrl: "https://github.com/facebook/react/issues/1001",
        isPullRequest: false,
        ageInDays: 14,
        isStale: false,
      },
      {
        id: 2,
        number: 1002,
        title: "useTransition starvation during rapid parent re-renders",
        body: "Concurrent mode starvation observed when parent re-renders rapidly during transition.",
        state: "open",
        author: { login: "contributor2", avatarUrl: "" },
        labels: [{ id: 10, name: "Component: Concurrent", color: "b60205" }],
        commentsCount: 2,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        closedAt: null,
        htmlUrl: "https://github.com/facebook/react/issues/1002",
        isPullRequest: false,
        ageInDays: 5,
        isStale: false,
      },
      {
        id: 3,
        number: 1003,
        title: "Documentation update for Server Components setup",
        body: "Typo fix in getting started guide for Next.js app router.",
        state: "closed",
        author: { login: "docswriter", avatarUrl: "" },
        labels: [{ id: 20, name: "Type: Documentation", color: "0075ca" }],
        commentsCount: 1,
        createdAt: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        htmlUrl: "https://github.com/facebook/react/issues/1003",
        isPullRequest: false,
        ageInDays: 100,
        isStale: false,
      },
    ];

    // 3. Health calculation
    const health = calculateRepositoryHealth(mockRepo, mockIssues);
    expect(health.score).toBeGreaterThan(70);
    expect(["A+", "A", "B"]).toContain(health.grade);

    // 4. Duplicate Detection Radar
    const duplicates = findPotentialDuplicates(mockIssues, 0.35);
    expect(duplicates.length).toBeGreaterThanOrEqual(1);
    expect(duplicates[0].sharedTerms).toContain("usetransition");
    expect(duplicates[0].similarityScore).toBeGreaterThanOrEqual(50);

    // 5. Export generation
    const csv = generateIssuesCsv(mockIssues, "facebook/react");
    expect(csv).toContain("facebook/react");
    expect(csv).toContain("useTransition");

    const analysisPayload: RepositoryAnalysisPayload = {
      repository: mockRepo,
      health,
      issues: mockIssues,
      labelsDistribution: [
        { name: "Component: Concurrent", color: "b60205", count: 2 },
        { name: "Type: Documentation", color: "0075ca", count: 1 },
      ],
      activityTimeline: [],
      rateLimit: { limit: 5000, remaining: 4990, resetAt: new Date().toISOString(), isApproachingLimit: false },
    };

    const markdown = generateRepositoryMarkdownReport(analysisPayload);
    expect(markdown).toContain("# IssuePilot Intelligence Report: facebook/react");

    // 6. Persistence to database
    const saved = await prisma.savedAnalysis.create({
      data: {
        owner: "facebook",
        repo: "react",
        repoName: "facebook/react",
        description: mockRepo.description,
        stars: mockRepo.stars,
        forks: mockRepo.forks,
        openIssues: mockRepo.openIssuesCount,
        openPrs: mockRepo.openPrCount,
        healthScore: health.score,
        primaryLanguage: "JavaScript",
        dataSnapshot: JSON.stringify(analysisPayload),
      },
    });

    expect(saved.id).toBeDefined();

    // Query back
    const retrieved = await prisma.savedAnalysis.findUnique({
      where: { id: saved.id },
    });
    expect(retrieved?.repoName).toBe("facebook/react");

    // Cleanup
    await prisma.savedAnalysis.delete({
      where: { id: saved.id },
    });
  });
});
