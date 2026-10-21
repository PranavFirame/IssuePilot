import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getServerAuthUser } from "@/lib/auth/session";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized: Sign in required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        accounts: {
          select: {
            provider: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          githubId: user.githubId,
          githubUsername: user.githubUsername,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          connectedAccounts: user.accounts.map((a) => a.provider),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Profile error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized: Sign in required" }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid profile data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, bio, avatarUrl } = validation.data;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          bio: updated.bio,
          avatarUrl: updated.avatarUrl,
          githubUsername: updated.githubUsername,
          isVerified: updated.isVerified,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Failed to update profile: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
