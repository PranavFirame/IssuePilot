import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { extractGuestId } from "@/lib/auth/guest-session";
import { migrateGuestData } from "@/lib/auth/guest-migration";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`login:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      // Return identical error for both missing user or wrong password to prevent user enumeration
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session and set session cookie
    const { sessionToken, expiresAt } = await createSession(user.id);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          githubUsername: user.githubUsername,
          isVerified: user.isVerified,
        },
      },
      { status: 200 }
    );

    setSessionCookie(sessionToken, expiresAt, response);

    // Safely migrate any guest data the visitor created before signing in
    const guestId = extractGuestId(req);
    if (guestId) {
      await migrateGuestData(guestId, user.id, response);
    }

    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Login error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
