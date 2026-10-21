import { describe, expect, it } from "vitest";
import { GET as getPreferencesHandler, POST as savePreferencesHandler } from "../../app/api/workspace/preferences/route";
import {
  DELETE as deleteWorkspaceHandler,
  GET as getWorkspaceHandler,
  PATCH as patchWorkspaceHandler,
  POST as postWorkspaceHandler,
} from "../../app/api/workspace/route";
import { NextRequest } from "next/server";
import { generateGuestId, GUEST_COOKIE_NAME } from "@/lib/auth/guest-session";

describe("Explore & Workspace Full Integration", () => {
  const testGuestId = generateGuestId();
  const testHeaders = {
    "Content-Type": "application/json",
    cookie: `${GUEST_COOKIE_NAME}=${testGuestId}`,
  };

  let trackedItemId: string;

  it("saves and retrieves user preferences", async () => {
    const postReq = new NextRequest("http://localhost:3000/api/workspace/preferences", {
      method: "POST",
      headers: testHeaders,
      body: JSON.stringify({
        languages: ["Rust", "TypeScript"],
        experienceLevel: "beginner",
        topics: ["cli", "compiler"],
        monthlyGoal: 5,
      }),
    });

    const postRes = await savePreferencesHandler(postReq);
    expect(postRes.status).toBe(200);
    const postJson = await postRes.json();
    expect(postJson.success).toBe(true);
    expect(postJson.preferences.languages).toContain("Rust");
    expect(postJson.preferences.monthlyGoal).toBe(5);

    // Retrieve
    const getReq = new NextRequest("http://localhost:3000/api/workspace/preferences", {
      method: "GET",
      headers: testHeaders,
    });
    const getRes = await getPreferencesHandler(getReq);
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.languages).toContain("TypeScript");
  });

  it("tracks an issue into workspace and records notes", async () => {
    const req = new NextRequest("http://localhost:3000/api/workspace", {
      method: "POST",
      headers: testHeaders,
      body: JSON.stringify({
        issueNumber: 101,
        repoOwner: "test-org",
        repoName: "test-repo",
        title: "Fix documentation broken link in getting started",
        htmlUrl: "https://github.com/test-org/test-repo/issues/101",
        state: "open",
        status: "saved",
        notes: "Initial review: looks like a 404 in README line 20.",
        labels: JSON.stringify(["documentation", "good first issue"]),
        language: "TypeScript",
        difficulty: "good first issue",
      }),
    });

    const res = await postWorkspaceHandler(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.item.id).toBeDefined();
    trackedItemId = json.item.id;
  });

  it("updates issue status to in_progress and completed with verified PR URL", async () => {
    expect(trackedItemId).toBeDefined();

    // 1. Move to in_progress
    const patchReq1 = new NextRequest("http://localhost:3000/api/workspace", {
      method: "PATCH",
      headers: testHeaders,
      body: JSON.stringify({
        id: trackedItemId,
        status: "in_progress",
        notes: "Started working on PR branch fix/docs-link.",
      }),
    });
    const res1 = await patchWorkspaceHandler(patchReq1);
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.item.status).toBe("in_progress");

    // 2. Mark completed with valid PR URL
    const prUrl = "https://github.com/test-org/test-repo/pull/105";
    const patchReq2 = new NextRequest("http://localhost:3000/api/workspace", {
      method: "PATCH",
      headers: testHeaders,
      body: JSON.stringify({
        id: trackedItemId,
        status: "completed",
        prUrl,
      }),
    });
    const res2 = await patchWorkspaceHandler(patchReq2);
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.item.status).toBe("completed");
    expect(json2.item.isPrConfirmed).toBe(true);
    expect(json2.item.prUrl).toBe(prUrl);
  });

  it("retrieves tracked issues for user", async () => {
    const req = new NextRequest("http://localhost:3000/api/workspace", {
      method: "GET",
      headers: testHeaders,
    });
    const res = await getWorkspaceHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.trackedIssues.length).toBeGreaterThanOrEqual(1);
    expect(json.trackedIssues[0].id).toBe(trackedItemId);
  });

  it("removes tracked issue", async () => {
    expect(trackedItemId).toBeDefined();
    const req = new NextRequest(`http://localhost:3000/api/workspace?id=${trackedItemId}`, {
      method: "DELETE",
      headers: testHeaders,
    });
    const res = await deleteWorkspaceHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
