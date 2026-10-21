import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";

const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(191),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  name: z.string().min(1, "Name is required").max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        passwordHash,
        isVerified: false,
      },
    });

    // Create initial user preferences
    await prisma.userPreference.create({
      data: {
        userId: user.id,
        languages: JSON.stringify(["TypeScript", "JavaScript", "Python"]),
        experienceLevel: "beginner",
        topics: JSON.stringify(["web", "react", "tools"]),
        monthlyGoal: 3,
      },
    }).catch(() => {});

    // Create session
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
          isVerified: user.isVerified,
        },
      },
      { status: 201 }
    );

    setSessionCookie(sessionToken, expiresAt, response);
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Registration error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
