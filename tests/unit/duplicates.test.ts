import { describe, expect, it } from "vitest";
import { findPotentialDuplicates, tokenize } from "../../lib/triage/duplicates";
import { NormalizedIssue } from "../../lib/github/types";

describe("duplicate detection", () => {
  it("tokenizes and cleans technical text correctly", () => {
    const text = "Memory leak in WebSocket client connection when reconnecting!";
    const tokens = tokenize(text);
    expect(tokens).toContain("memory");
    expect(tokens).toContain("leak");
    expect(tokens).toContain("websocket");
    expect(tokens).toContain("connection");
    expect(tokens).toContain("reconnecting");
    // Stop words removed
    expect(tokens).not.toContain("in");
    expect(tokens).not.toContain("when");
  });

  it("identifies duplicate issues with high overlap", () => {
    const issues: NormalizedIssue[] = [
      {
        id: 101,
        number: 101,
        title: "Memory leak in WebSocket client connection",
        body: "WebSocket connection leaks memory after multiple reconnection attempts in production.",
        state: "open",
        author: { login: "user1", avatarUrl: "" },
        labels: [],
        commentsCount: 2,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
        closedAt: null,
        htmlUrl: "https://github.com/org/repo/issues/101",
        isPullRequest: false,
        ageInDays: 10,
        isStale: false,
      },
      {
        id: 102,
        number: 102,
        title: "WebSocket client memory leak on reconnect",
        body: "Whenever reconnecting, WebSocket client leaks memory over time.",
        state: "open",
        author: { login: "user2", avatarUrl: "" },
        labels: [],
        commentsCount: 0,
        createdAt: "2026-01-05T00:00:00Z",
        updatedAt: "2026-01-05T00:00:00Z",
        closedAt: null,
        htmlUrl: "https://github.com/org/repo/issues/102",
        isPullRequest: false,
        ageInDays: 5,
        isStale: false,
      },
      {
        id: 103,
        number: 103,
        title: "Add dark mode toggle to navigation settings",
        body: "User interface needs a toggle for light and dark theme preferences.",
        state: "open",
        author: { login: "user3", avatarUrl: "" },
        labels: [],
        commentsCount: 1,
        createdAt: "2026-01-06T00:00:00Z",
        updatedAt: "2026-01-06T00:00:00Z",
        closedAt: null,
        htmlUrl: "https://github.com/org/repo/issues/103",
        isPullRequest: false,
        ageInDays: 4,
        isStale: false,
      },
    ];

    const duplicates = findPotentialDuplicates(issues, 0.4);
    expect(duplicates.length).toBeGreaterThanOrEqual(1);

    const match = duplicates[0];
    expect([101, 102]).toContain(match.primaryIssue.number);
    expect([101, 102]).toContain(match.similarIssue.number);
    expect(match.similarityScore).toBeGreaterThanOrEqual(50);
    expect(match.sharedTerms).toContain("websocket");
    expect(match.sharedTerms).toContain("leak");
  });

  it("does not falsely match completely unrelated issues", () => {
    const issues: NormalizedIssue[] = [
      {
        id: 1,
        number: 1,
        title: "Docker container fails to bind to port 8080",
        body: "Docker alpine linux container networking issue.",
        state: "open",
        author: { login: "u1", avatarUrl: "" },
        labels: [],
        commentsCount: 0,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        closedAt: null,
        htmlUrl: "https://github.com/org/repo/issues/1",
        isPullRequest: false,
        ageInDays: 1,
        isStale: false,
      },
      {
        id: 2,
        number: 2,
        title: "Fix typo in documentation README",
        body: "Spelling error in getting started guide line 45.",
        state: "open",
        author: { login: "u2", avatarUrl: "" },
        labels: [],
        commentsCount: 0,
        createdAt: "2026-01-02T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
        closedAt: null,
        htmlUrl: "https://github.com/org/repo/issues/2",
        isPullRequest: false,
        ageInDays: 1,
        isStale: false,
      },
    ];

    const duplicates = findPotentialDuplicates(issues, 0.4);
    expect(duplicates.length).toBe(0);
  });
});
