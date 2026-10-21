import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "./session";
import { AuthUser } from "./types";

export const GUEST_COOKIE_NAME = "issuepilot_guest_id";
export const GUEST_MAX_AGE_DAYS = 30;

export interface SessionOrGuestResult {
  isAuthenticated: boolean;
  userId: string;
  user?: AuthUser;
  isNewGuest: boolean;
  attachCookie: (res: NextResponse) => NextResponse;
}

export function generateGuestId(): string {
  return `guest_${crypto.randomBytes(16).toString("hex")}`;
}

export function isValidGuestId(id: string | null | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  return /^guest_[a-f0-9]{32}$/.test(id);
}

export function setGuestCookie(guestId: string, res: NextResponse): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const expiresAt = new Date(Date.now() + GUEST_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  res.cookies.set(GUEST_COOKIE_NAME, guestId, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return res;
}

export function clearGuestCookie(res: NextResponse): NextResponse {
  res.cookies.set(GUEST_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return res;
}

export function extractGuestId(req: Request | NextRequest): string | null {
  let cookieVal: string | undefined;

  if ("cookies" in req && typeof (req as any).cookies?.get === "function") {
    cookieVal = (req as NextRequest).cookies.get(GUEST_COOKIE_NAME)?.value;
  }

  if (!cookieVal) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|; )${GUEST_COOKIE_NAME}=([^;]*)`));
      if (match) {
        cookieVal = decodeURIComponent(match[1]);
      }
    }
  }

  return isValidGuestId(cookieVal) ? cookieVal! : null;
}

/**
 * Resolves verified identity:
 * 1. If user is authenticated via server session -> binds to user.id
 * 2. If guest -> binds to verified guest cookie ID (or generates a fresh isolated guest ID)
 * Never trusts a client-supplied user ID parameter.
 */
export async function resolveSessionOrGuest(req: Request | NextRequest): Promise<SessionOrGuestResult> {
  const authUser = await getServerAuthUser(req);

  if (authUser) {
    return {
      isAuthenticated: true,
      userId: authUser.id,
      user: authUser,
      isNewGuest: false,
      attachCookie: (res: NextResponse) => res,
    };
  }

  const existingGuestId = extractGuestId(req);

  if (existingGuestId) {
    return {
      isAuthenticated: false,
      userId: existingGuestId,
      isNewGuest: false,
      attachCookie: (res: NextResponse) => res,
    };
  }

  // Create isolated new guest ID
  const newGuestId = generateGuestId();
  return {
    isAuthenticated: false,
    userId: newGuestId,
    isNewGuest: true,
    attachCookie: (res: NextResponse) => setGuestCookie(newGuestId, res),
  };
}
