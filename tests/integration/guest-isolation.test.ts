import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { GET as getWorkspaceHandler, POST as postWorkspaceHandler, PATCH as patchWorkspaceHandler, DELETE as deleteWorkspaceHandler } from "@/app/api/workspace/route";
import { GET as getPrefsHandler, POST as postPrefsHandler } from "@/app/api/workspace/preferences/route";
import { POST as migrateGuestHandler } from "@/app/api/auth/migrate-guest/route";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { generateGuestId, GUEST_COOKIE_NAME } from "@/lib/auth/guest-session";
import { checkRateLimit } from "@/lib/security/rate-limiter";

describe("Guest Session Isolation & Data Ownership (Security Phase 1)", () => {
  const guestA = generateGuestId();
  const guestB = generateGuestId();

  it("proves two separate guests receive isolated workspace data", async () => {
    // 1. Guest A saves an issue
    const reqA = new NextRequest("http://localhost:3000/api/workspace", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${GUEST_COOKIE_NAME}=${guestA}`,
      },
      body: JSON.stringify({
        issueNumber: 101,
        repoOwner: "facebook",
        repoName: "react",
        title: "Guest A Secret Issue",
        htmlUrl: "https://github.com/facebook/react/issues/101",
        notes: "Guest A private notes",
      }),
    });

    const resA = await postWorkspaceHandler(reqA);
    expect(resA.status).toBe(201);

    // 2. Guest B queries workspace
    const reqB = new NextRequest("http://localhost:3000/api/workspace", {
      method: "GET",
      headers: {
        cookie: `${GUEST_COOKIE_NAME}=${guestB}`,
      },
    });

    const resB = await getWorkspaceHandler(reqB);
    expect(resB.status).toBe(200);
    const jsonB = await resB.json();

    // Guest B must NOT see Guest A's issues
    const foundGuestAIssue = jsonB.trackedIssues.some(
      (item: any) => item.title === "Guest A Secret Issue"
    );
    expect(foundGuestAIssue).toBe(false);

    // 3. Guest A queries workspace and confirms their issue is present
    const reqACheck = new NextRequest("http://localhost:3000/api/workspace", {
      method: "GET",
      headers: {
        cookie: `${GUEST_COOKIE_NAME}=${guestA}`,
      },
    });
    const resACheck = await getWorkspaceHandler(reqACheck);
    expect(resACheck.status).toBe(200);
    const jsonACheck = await resACheck.json();
    const guestAIssue = jsonACheck.trackedIssues.find(
      (item: any) => item.title === "Guest A Secret Issue"
    );
    expect(guestAIssue).toBeDefined();
    expect(guestAIssue.notes).toBe("Guest A private notes");
  });

  it("prevents arbitrary userId query parameter from bypassing guest isolation", async () => {
    // Attacker (Guest B) tries to query Guest A's data by appending ?userId=<guestA>
    const attackReq = new NextRequest(`http://localhost:3000/api/workspace?userId=${guestA}`, {
      method: "GET",
      headers: {
        cookie: `${GUEST_COOKIE_NAME}=${guestB}`,
      },
    });

    const attackRes = await getWorkspaceHandler(attackReq);
    expect(attackRes.status).toBe(200);
    const attackJson = await attackRes.json();

    // Server must ignore ?userId and strictly bind to the authenticated or guest cookie identity
    const containsGuestAData = attackJson.trackedIssues.some(
      (item: any) => item.title === "Guest A Secret Issue"
    );
    expect(containsGuestAData).toBe(false);
  });

  it("prevents Guest B from modifying or deleting Guest A's tracked issue (returns 403 Forbidden)", async () => {
    // Find Guest A's issue
    const issueA = await prisma.trackedIssue.findFirst({
      where: { userId: guestA },
    });
    expect(issueA).not.toBeNull();

    // Guest B tries to update Guest A's notes
    const patchReq = new NextRequest("http://localhost:3000/api/workspace", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: `${GUEST_COOKIE_NAME}=${guestB}`,
      },
      body: JSON.stringify({
        id: issueA!.id,
        notes: "Hacked notes by Guest B",
      }),
    });

    const patchRes = await patchWorkspaceHandler(patchReq);
    expect(patchRes.status).toBe(403);

    // Guest B tries to delete Guest A's issue
    const deleteReq = new NextRequest(`http://localhost:3000/api/workspace?id=${issueA!.id}`, {
      method: "DELETE",
      headers: {
        cookie: `${GUEST_COOKIE_NAME}=${guestB}`,
      },
    });

    const deleteRes = await deleteWorkspaceHandler(deleteReq);
    expect(deleteRes.status).toBe(403);

    // Verify Issue A is intact
    const verifyIssue = await prisma.trackedIssue.findUnique({
      where: { id: issueA!.id },
    });
    expect(verifyIssue).not.toBeNull();
    expect(verifyIssue?.notes).toBe("Guest A private notes");
  });

  it("safely migrates guest data to a registered user account upon sign-in", async () => {
    // 1. Create a guest session with a tracked issue and custom preferences
    const migratableGuest = generateGuestId();
    await prisma.trackedIssue.create({
      data: {
        userId: migratableGuest,
        issueNumber: 202,
        repoOwner: "vercel",
        repoName: "next.js",
        title: "Guest Issue for Migration",
        htmlUrl: "https://github.com/vercel/next.js/issues/202",
        notes: "Important pre-signup notes",
      },
    });

    await prisma.userPreference.create({
      data: {
        userId: migratableGuest,
        languages: JSON.stringify(["Rust", "Go"]),
        experienceLevel: "intermediate",
        topics: JSON.stringify(["cli", "systems"]),
        monthlyGoal: 5,
      },
    });

    // 2. Create target user account
    const testUser = await prisma.user.create({
      data: {
        email: `migration_test_${Date.now()}@issuepilot.test`,
        name: "Migration Tester",
        isVerified: true,
      },
    });

    const { sessionToken } = await createSession(testUser.id);

    // 3. Execute migration request
    const migrateReq = new NextRequest("http://localhost:3000/api/auth/migrate-guest", {
      method: "POST",
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken}; ${GUEST_COOKIE_NAME}=${migratableGuest}`,
      },
    });

    const migrateRes = await migrateGuestHandler(migrateReq);
    expect(migrateRes.status).toBe(200);
    const migrateJson = await migrateRes.json();
    expect(migrateJson.success).toBe(true);
    expect(migrateJson.summary.migratedIssuesCount).toBe(1);
    expect(migrateJson.summary.preferencesMigrated).toBe(true);

    // 4. Verify user now owns the issue
    const userIssue = await prisma.trackedIssue.findFirst({
      where: {
        userId: testUser.id,
        issueNumber: 202,
      },
    });
    expect(userIssue).not.toBeNull();
    expect(userIssue?.notes).toBe("Important pre-signup notes");

    // 5. Verify user received the migrated preferences
    const userPrefs = await prisma.userPreference.findUnique({
      where: { userId: testUser.id },
    });
    expect(userPrefs).not.toBeNull();
    expect(JSON.parse(userPrefs!.languages)).toEqual(["Rust", "Go"]);
    expect(userPrefs?.experienceLevel).toBe("intermediate");

    // 6. Verify old guest records were purged (no orphaned data)
    const leftoverGuestIssues = await prisma.trackedIssue.findMany({
      where: { userId: migratableGuest },
    });
    expect(leftoverGuestIssues.length).toBe(0);

    // 7. Verify migration is idempotent (running it again causes zero crashes or duplicates)
    const secondMigrateRes = await migrateGuestHandler(migrateReq);
    expect(secondMigrateRes.status).toBe(200);
    const userIssuesCount = await prisma.trackedIssue.count({
      where: { userId: testUser.id, issueNumber: 202 },
    });
    expect(userIssuesCount).toBe(1);
  });

  it("verifies in-memory rate limiting stops abusive traffic", () => {
    const testKey = `test-ip-${Date.now()}`;
    const limit = 5;
    const windowSec = 10;

    // Make 5 requests within limit
    for (let i = 0; i < limit; i++) {
      const result = checkRateLimit(testKey, limit, windowSec);
      expect(result.allowed).toBe(true);
    }

    // 6th request must be blocked
    const blockedResult = checkRateLimit(testKey, limit, windowSec);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
  });
});
