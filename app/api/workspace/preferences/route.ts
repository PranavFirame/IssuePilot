import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const preferencesSchema = z.object({
  userId: z.string().default("default-user"),
  languages: z.array(z.string()).default(["TypeScript", "JavaScript", "Python"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  topics: z.array(z.string()).default(["web", "react", "tools"]),
  monthlyGoal: z.number().int().min(1).max(50).default(3),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "default-user";

    let pref = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.userPreference.create({
        data: {
          userId,
          languages: JSON.stringify(["TypeScript", "JavaScript", "Python"]),
          experienceLevel: "beginner",
          topics: JSON.stringify(["web", "react", "tools"]),
          monthlyGoal: 3,
        },
      });
    }

    return NextResponse.json(
      {
        userId: pref.userId,
        languages: JSON.parse(pref.languages),
        experienceLevel: pref.experienceLevel,
        topics: JSON.parse(pref.topics),
        monthlyGoal: pref.monthlyGoal,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: `Failed to fetch preferences: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = preferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid preferences data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { userId, languages, experienceLevel, topics, monthlyGoal } = validation.data;

    const updated = await prisma.userPreference.upsert({
      where: { userId },
      update: {
        languages: JSON.stringify(languages),
        experienceLevel,
        topics: JSON.stringify(topics),
        monthlyGoal,
      },
      create: {
        userId,
        languages: JSON.stringify(languages),
        experienceLevel,
        topics: JSON.stringify(topics),
        monthlyGoal,
      },
    });

    return NextResponse.json(
      {
        success: true,
        preferences: {
          userId: updated.userId,
          languages: JSON.parse(updated.languages),
          experienceLevel: updated.experienceLevel,
          topics: JSON.parse(updated.topics),
          monthlyGoal: updated.monthlyGoal,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: `Failed to update preferences: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
