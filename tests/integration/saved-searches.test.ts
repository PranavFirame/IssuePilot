import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  GET as getSavedSearchesHandler,
  POST as postSavedSearchesHandler,
  DELETE as deleteSavedSearchesHandler,
} from "@/app/api/saved-searches/route";
import { generateGuestId, GUEST_COOKIE_NAME } from "@/lib/auth/guest-session";
import { migrateGuestData } from "@/lib/auth/guest-migration";

describe("Saved Searches API & Security Integration", () => {
  const guestA = generateGuestId();
  const guestB = generateGuestId();

  it("creates a saved search for guest A and validates input", async () => {
    // Empty name should fail 400
    const emptyReq = new NextRequest("http://localhost:3000/api/saved-searches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${GUEST_COOKIE_NAME}=${guestA}`,
      },
      body: JSON.stringify({ name: "   " }),
    });
    const emptyRes = await postSavedSearchesHandler(emptyReq);
    expect(emptyRes.status).toBe(400);

    // Valid search creation
    const validReq = new NextRequest("http://localhost:3000/api/saved-searches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${GUEST_COOKIE_NAME}=${guestA}`,
      },
      body: JSON.stringify({
        name: "React TypeScript Beginner Issues",
        query: "label:\"good first issue\"",
        language: "typescript",
        difficulty: "good first issue",
        sort: "updated",
      }),
    });
    const validRes = await postSavedSearchesHandler(validReq);
    expect(validRes.status).toBe(201);
    const validJson = await validRes.json();
    expect(validJson.search.name).toBe("React TypeScript Beginner Issues");
    expect(validJson.search.userId).toBe(guestA);
  });

  it("enforces tenant isolation between Guest A and Guest B", async () => {
    // Guest B lists searches
    const reqB = new NextRequest("http://localhost:3000/api/saved-searches", {
      method: "GET",
      headers: {
        cookie: `${GUEST_COOKIE_NAME}=${guestB}`,
      },
    });
    const resB = await getSavedSearchesHandler(reqB);
    expect(resB.status).toBe(200);
    const jsonB = await resB.json();

    // Guest B must not see Guest A's saved search
    const foundGuestASearch = jsonB.searches.some(
      (s: any) => s.name === "React TypeScript Beginner Issues"
    );
    expect(foundGuestASearch).toBe(false);
  });

  it("prevents Guest B from deleting Guest A's saved search (returns 403)", async () => {
    // Find Guest A's search ID
    const searchA = await prisma.savedSearch.findFirst({
      where: { userId: guestA },
    });
    expect(searchA).not.toBeNull();

    // Guest B attempts to delete it
    const attackReq = new NextRequest(
      `http://localhost:3000/api/saved-searches?id=${searchA!.id}`,
      {
        method: "DELETE",
        headers: {
          cookie: `${GUEST_COOKIE_NAME}=${guestB}`,
        },
      }
    );
    const attackRes = await deleteSavedSearchesHandler(attackReq);
    expect(attackRes.status).toBe(403);

    // Verify it still exists in the database
    const stillExists = await prisma.savedSearch.findUnique({
      where: { id: searchA!.id },
    });
    expect(stillExists).not.toBeNull();
  });

  it("allows Guest A to delete their own saved search", async () => {
    const searchA = await prisma.savedSearch.findFirst({
      where: { userId: guestA },
    });
    expect(searchA).not.toBeNull();

    const deleteReq = new NextRequest(
      `http://localhost:3000/api/saved-searches?id=${searchA!.id}`,
      {
        method: "DELETE",
        headers: {
          cookie: `${GUEST_COOKIE_NAME}=${guestA}`,
        },
      }
    );
    const deleteRes = await deleteSavedSearchesHandler(deleteReq);
    expect(deleteRes.status).toBe(200);

    const deleted = await prisma.savedSearch.findUnique({
      where: { id: searchA!.id },
    });
    expect(deleted).toBeNull();
  });

  it("migrates saved searches from guest to registered user during login/registration", async () => {
    const guestC = generateGuestId();
    const registeredUserId = `user_test_${Date.now()}`;

    // Create a saved search for guest C
    await prisma.savedSearch.create({
      data: {
        userId: guestC,
        name: "Python ML Beginner",
        query: "machine learning",
        language: "python",
      },
    });

    // Run guest migration
    await migrateGuestData(guestC, registeredUserId);

    // Verify saved search is now owned by registered user
    const migrated = await prisma.savedSearch.findFirst({
      where: { userId: registeredUserId, name: "Python ML Beginner" },
    });
    expect(migrated).not.toBeNull();
    expect(migrated?.language).toBe("python");

    // Cleanup
    await prisma.savedSearch.deleteMany({
      where: { userId: registeredUserId },
    });
  });
});
