import { describe, expect, it } from "vitest";
import { calculateRecommendationScore } from "../../lib/recommendations/matcher";
import { BeginnerIssue } from "../../lib/github/search";

describe("calculateRecommendationScore", () => {
  const sampleIssue: BeginnerIssue = {
    id: 1,
    number: 42,
    title: "Add dark mode toggle to React docs tutorial",
    body: "First time contributors welcome to implement UI theme toggle.",
    state: "open",
    htmlUrl: "https://github.com/facebook/react/issues/42",
    commentsCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: { login: "maintainer", avatarUrl: "" },
    repository: {
      owner: "facebook",
      name: "react",
      fullName: "facebook/react",
      htmlUrl: "https://github.com/facebook/react",
      avatarUrl: "",
      stars: 200000,
      language: "TypeScript",
    },
    labels: [
      { id: 1, name: "good first issue", color: "7057ff" },
      { id: 2, name: "documentation", color: "0075ca" },
    ],
    difficulty: "good first issue",
    ageInDays: 3,
    freshness: "recent",
  };

  it("calculates high match score for aligned language, beginner level, and topics", () => {
    const result = calculateRecommendationScore(sampleIssue, {
      languages: ["TypeScript", "Rust"],
      experienceLevel: "beginner",
      topics: ["react", "docs"],
    });

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.isHeuristic).toBe(true);
    expect(result.reasons.some((r) => r.includes("TypeScript"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("good first issue"))).toBe(true);
  });

  it("yields lower score when language and topics do not match", () => {
    const result = calculateRecommendationScore(sampleIssue, {
      languages: ["Python", "Go"],
      experienceLevel: "advanced",
      topics: ["docker", "kubernetes"],
    });

    expect(result.score).toBeLessThan(50);
  });

  it("handles special characters in languages like C++ and C# without regex SyntaxErrors", () => {
    const cppIssue: BeginnerIssue = {
      ...sampleIssue,
      title: "Fix memory allocator in C++ core backend",
      repository: {
        ...sampleIssue.repository,
        language: "C++",
      },
      labels: [{ id: 3, name: "c++", color: "f34b7d" }],
    };

    expect(() => {
      const result = calculateRecommendationScore(cppIssue, {
        languages: ["C++", "C#"],
        experienceLevel: "beginner",
        topics: ["c++", "compiler"],
      });
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.reasons.some((r) => r.includes("C++"))).toBe(true);
    }).not.toThrow();
  });
});
