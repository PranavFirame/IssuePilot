import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { AuthUser, SessionWithUser } from "./types";

export const SESSION_COOKIE_NAME = "issuepilot_session";
export const SESSION_MAX_AGE_DAYS = 30;

function sanitizeUser(user: any): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    githubId: user.githubId,
    githubUsername: user.githubUsername,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

/**
 * Creates a cryptographically random session token for the user,
 * persisted in the database with a 30-day expiration.
 */
export async function createSession(userId: string): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
    },
  });

  return { sessionToken, expiresAt };
}

/**
 * Validates a session token. Returns the session and sanitized user if valid and active,
 * or null if invalid or expired (cleaning up expired sessions automatically).
 */
export async function validateSession(sessionToken: string): Promise<SessionWithUser | null> {
  if (!sessionToken || typeof sessionToken !== "string") {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    id: session.id,
    sessionToken: session.sessionToken,
    userId: session.userId,
    expiresAt: session.expiresAt,
    user: sanitizeUser(session.user),
  };
}

/**
 * Invalidates and deletes a session by token.
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return;
  await prisma.session.delete({ where: { sessionToken } }).catch(() => {});
}

/**
 * Resolves the authenticated user from the current request.
 * Checks request headers/cookies first, then falls back to Next.js cookies().
 */
export async function getServerAuthUser(req?: Request): Promise<AuthUser | null> {
  let token: string | undefined;

  if (req) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Not in a request context supporting cookies()
    }
  }

  if (!token) {
    return null;
  }

  const validated = await validateSession(token);
  return validated ? validated.user : null;
}

/**
 * Helper to set a secure httpOnly session cookie on a NextResponse.
 */
export function setSessionCookie(sessionToken: string, expiresAt: Date, res: NextResponse): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Helper to clear the session cookie on a NextResponse.
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}
