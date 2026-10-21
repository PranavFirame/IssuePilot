import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";

describe("Prisma Auth Models", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  let createdUserId: string;

  it("creates a User record with email and profile fields", async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Test User",
        bio: "Open source contributor",
        isVerified: true,
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.name).toBe("Test User");
    expect(user.bio).toBe("Open source contributor");
    createdUserId = user.id;
  });

  it("creates a Session linked to the user", async () => {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const session = await prisma.session.create({
      data: {
        userId: createdUserId,
        sessionToken: `token_${Date.now()}`,
        expiresAt,
      },
    });

    expect(session.id).toBeDefined();
    expect(session.userId).toBe(createdUserId);
  });

  it("creates a VerificationToken for email verification", async () => {
    const token = await prisma.verificationToken.create({
      data: {
        identifier: testEmail,
        token: `verify_${Date.now()}`,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    expect(token.id).toBeDefined();
    expect(token.type).toBe("email_verification");
  });

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
      await prisma.verificationToken.deleteMany({ where: { identifier: testEmail } }).catch(() => {});
    }
  });
});
