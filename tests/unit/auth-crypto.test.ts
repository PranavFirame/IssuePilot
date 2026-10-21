import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, validateSession, invalidateSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

describe("Auth Cryptography & Session Management", () => {
  const testPassword = "SuperSecurePassword123!";
  const testEmail = `crypto_test_${Date.now()}@example.com`;
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Crypto Tester",
        passwordHash: await hashPassword(testPassword),
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  describe("Password Hashing & Constant-time Verification", () => {
    it("hashes password with a random salt", async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(testPassword);
      expect(hash1).toMatch(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
      // Different salts produce different hashes
      expect(hash1).not.toBe(hash2);
    });

    it("verifies correct password against hash", async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);
      expect(isValid).toBe(true);
    });

    it("rejects incorrect password", async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword("WrongPassword456!", hash);
      expect(isValid).toBe(false);
    });

    it("rejects malformed hashes safely without throwing", async () => {
      const isValid = await verifyPassword(testPassword, "not_a_valid_hash");
      expect(isValid).toBe(false);
    });
  });

  describe("Session Lifecycle", () => {
    let sessionToken: string;

    it("creates a secure session for a user", async () => {
      const session = await createSession(testUserId);
      expect(session.sessionToken).toBeDefined();
      expect(session.sessionToken.length).toBeGreaterThanOrEqual(64);
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
      sessionToken = session.sessionToken;
    });

    it("validates an active session and returns sanitized user", async () => {
      const result = await validateSession(sessionToken);
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe(testUserId);
      expect(result?.user.email).toBe(testEmail);
      // Ensure passwordHash is never leaked on the session user object
      expect((result?.user as any).passwordHash).toBeUndefined();
    });

    it("invalidates and deletes a session", async () => {
      await invalidateSession(sessionToken);
      const result = await validateSession(sessionToken);
      expect(result).toBeNull();
    });

    it("rejects expired sessions", async () => {
      const expiredSession = await prisma.session.create({
        data: {
          userId: testUserId,
          sessionToken: `expired_${Date.now()}`,
          expiresAt: new Date(Date.now() - 1000 * 60), // 1 min ago
        },
      });

      const result = await validateSession(expiredSession.sessionToken);
      expect(result).toBeNull();
    });
  });
});
