import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { GET as workspaceGet, POST as workspacePost } from "@/app/api/workspace/route";
import { GET as prefsGet, POST as prefsPost } from "@/app/api/workspace/preferences/route";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import { calculateRecommendationScore } from "@/lib/recommendations/matcher";
import { BeginnerIssue } from "@/lib/github/search";

describe("Personalized Dashboard & Recommendation Engine", () => {
  const testEmail = `dashboard_test_${Date.now()}@example.com`;
  let userCookie: string;
  let testUserId: string;

  beforeAll(async () => {
    const regReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: "SecurePassword123!", name: "Dashboard Tester" }),
    });
    const res = await registerHandler(regReq);
    userCookie = res.headers.get("set-cookie")?.match(/issuepilot_session=([^;]+)/)?.[0] || "";
    const json = await res.json();
    testUserId = json.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => {});
  });

  it("saves and retrieves personalized tech preferences for authenticated user", async () => {
    const postReq = new NextRequest("http://localhost:3000/api/workspace/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({
        languages: ["Rust", "TypeScript"],
        experienceLevel: "beginner",
        topics: ["cli", "devtools"],
        monthlyGoal: 5,
      }),
    });
    const postRes = await prefsPost(postReq);
    expect(postRes.status).toBe(200);

    const getReq = new NextRequest("http://localhost:3000/api/workspace/preferences", {
      headers: { Cookie: userCookie },
    });
    const getRes = await prefsGet(getReq);
    expect(getRes.status).toBe(200);
    const json = await getRes.json();
    expect(json.languages).toEqual(["Rust", "TypeScript"]);
    expect(json.monthlyGoal).toBe(5);
  });

  it("calculates transparent relevance scoring against user preferences", () => {
    const issueMatching: BeginnerIssue = {
      id: 9991,
      number: 42,
      title: "Add CLI help command in Rust",
      body: "Good starter issue for Rust learners to add help flag to the CLI tool.",
      state: "open",
      author: { login: "rust-maintainer", avatarUrl: "" },
      labels: [{ id: 1, name: "good first issue", color: "7057ff" }],
      commentsCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      htmlUrl: "https://github.com/rust-lang/cli/issues/42",
      repository: {
        owner: "rust-lang",
        name: "cli",
        fullName: "rust-lang/cli",
        description: "Official CLI tool",
        stars: 1200,
        language: "Rust",
        htmlUrl: "https://github.com/rust-lang/cli",
        avatarUrl: "",
      },
      difficulty: "good first issue",
      freshness: "recent",
      ageInDays: 2,
    };

    const match = calculateRecommendationScore(issueMatching, {
      languages: ["Rust", "TypeScript"],
      experienceLevel: "beginner",
      topics: ["cli"],
      monthlyGoal: 5,
    });

    expect(match.score).toBeGreaterThanOrEqual(60);
    expect(match.reasons.some((r) => r.toLowerCase().includes("rust"))).toBe(true);
    expect(match.reasons.some((r) => r.toLowerCase().includes("beginner") || r.toLowerCase().includes("first"))).toBe(true);
  });

  it("records and retrieves recently viewed issue in authenticated workspace", async () => {
    const recordReq = new NextRequest("http://localhost:3000/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({
        type: "record_view",
        issueNumber: 42,
        repoOwner: "rust-lang",
        repoName: "cli",
        title: "Add CLI help command in Rust",
        htmlUrl: "https://github.com/rust-lang/cli/issues/42",
        language: "Rust",
      }),
    });
    const recordRes = await workspacePost(recordReq);
    expect(recordRes.status).toBe(201);

    const getReq = new NextRequest("http://localhost:3000/api/workspace", {
      headers: { Cookie: userCookie },
    });
    const getRes = await workspaceGet(getReq);
    expect(getRes.status).toBe(200);
    const json = await getRes.json();
    expect(json.recentlyViewed.length).toBeGreaterThanOrEqual(1);
    expect(json.recentlyViewed[0].repoName).toBe("cli");
  });
});
