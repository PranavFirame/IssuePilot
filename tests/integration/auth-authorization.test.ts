import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { GET as workspaceGet, POST as workspacePost, PATCH as workspacePatch, DELETE as workspaceDelete } from "@/app/api/workspace/route";
import { GET as profileGet, PATCH as profilePatch } from "@/app/api/user/profile/route";
import { DELETE as accountDelete } from "@/app/api/user/account/route";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

describe("Cross-Tenant Authorization & User Profile Security", () => {
  const userAEmail = `user_a_${Date.now()}@example.com`;
  const userBEmail = `user_b_${Date.now()}@example.com`;
  let userACookie: string;
  let userBCookie: string;
  let userAIssueId: string;

  beforeAll(async () => {
    // Register User A
    const regAReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail, password: "Password123!A", name: "User A" }),
    });
    const resA = await registerHandler(regAReq);
    const cookieA = resA.headers.get("set-cookie")?.match(/issuepilot_session=([^;]+)/)?.[0] || "";
    userACookie = cookieA;

    // Register User B
    const regBReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userBEmail, password: "Password123!B", name: "User B" }),
    });
    const resB = await registerHandler(regBReq);
    const cookieB = resB.headers.get("set-cookie")?.match(/issuepilot_session=([^;]+)/)?.[0] || "";
    userBCookie = cookieB;

    // User A creates a tracked issue
    const createReq = new NextRequest("http://localhost:3000/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userACookie },
      body: JSON.stringify({
        issueNumber: 101,
        repoOwner: "facebook",
        repoName: "react",
        title: "User A Private Tracked Issue",
        htmlUrl: "https://github.com/facebook/react/issues/101",
        status: "saved",
        notes: "Confidential implementation note from User A",
      }),
    });
    const createRes = await workspacePost(createReq);
    const createJson = await createRes.json();
    userAIssueId = createJson.item.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [userAEmail, userBEmail] } } }).catch(() => {});
  });

  it("User B cannot see User A's tracked issues in their workspace", async () => {
    const reqB = new NextRequest("http://localhost:3000/api/workspace", {
      headers: { Cookie: userBCookie },
    });
    const resB = await workspaceGet(reqB);
    const jsonB = await resB.json();

    const found = jsonB.trackedIssues.find((i: any) => i.id === userAIssueId);
    expect(found).toBeUndefined();
  });

  it("User B cannot modify User A's tracked issue (returns 403 Forbidden)", async () => {
    const patchReq = new NextRequest("http://localhost:3000/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: userBCookie },
      body: JSON.stringify({
        id: userAIssueId,
        notes: "Tampered note by User B!",
      }),
    });

    const patchRes = await workspacePatch(patchReq);
    expect(patchRes.status).toBe(403);
    const json = await patchRes.json();
    expect(json.error).toContain("permission");

    // Verify original note was NOT changed
    const item = await prisma.trackedIssue.findUnique({ where: { id: userAIssueId } });
    expect(item?.notes).toContain("Confidential implementation note from User A");
  });

  it("User B cannot delete User A's tracked issue (returns 403 Forbidden)", async () => {
    const deleteReq = new NextRequest(`http://localhost:3000/api/workspace?id=${userAIssueId}`, {
      method: "DELETE",
      headers: { Cookie: userBCookie },
    });

    const deleteRes = await workspaceDelete(deleteReq);
    expect(deleteRes.status).toBe(403);

    // Verify issue still exists
    const item = await prisma.trackedIssue.findUnique({ where: { id: userAIssueId } });
    expect(item).not.toBeNull();
  });

  it("GET /api/user/profile returns the authenticated user's profile", async () => {
    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      headers: { Cookie: userACookie },
    });
    const res = await profileGet(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.email).toBe(userAEmail);
    expect(json.user.name).toBe("User A");
  });

  it("PATCH /api/user/profile updates name and bio for authenticated user", async () => {
    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: userACookie },
      body: JSON.stringify({
        name: "User A Updated",
        bio: "Senior OSS Architect",
      }),
    });
    const res = await profilePatch(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.name).toBe("User A Updated");
    expect(json.user.bio).toBe("Senior OSS Architect");
  });

  it("DELETE /api/user/account securely removes user account and associated personal records", async () => {
    const deleteReq = new NextRequest("http://localhost:3000/api/user/account", {
      method: "DELETE",
      headers: { Cookie: userACookie },
    });

    const deleteRes = await accountDelete(deleteReq);
    expect(deleteRes.status).toBe(200);

    // Verify user was deleted
    const user = await prisma.user.findUnique({ where: { email: userAEmail } });
    expect(user).toBeNull();

    // Verify user's tracked issues were cascade deleted
    const issues = await prisma.trackedIssue.findMany({ where: { id: userAIssueId } });
    expect(issues.length).toBe(0);
  });
});
