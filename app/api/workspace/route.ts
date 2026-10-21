import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getServerAuthUser } from "@/lib/auth/session";

const trackedIssueSchema = z.object({
  userId: z.string().optional(),
  issueNumber: z.number().int().positive(),
  repoOwner: z.string().min(1).max(100),
  repoName: z.string().min(1).max(100),
  title: z.string().min(1).max(1000),
  htmlUrl: z.string().url(),
  state: z.enum(["open", "closed"]).default("open"),
  status: z.enum(["saved", "interested", "in_progress", "completed"]).default("saved"),
  notes: z.string().nullable().optional(),
  labels: z.string().default("[]"),
  language: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  prUrl: z.string().nullable().optional(),
});

const patchIssueSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["saved", "interested", "in_progress", "completed"]).optional(),
  notes: z.string().nullable().optional(),
  prUrl: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser(req);
    const { searchParams } = new URL(req.url);

    // If authenticated, strictly use their verified user ID.
    // If unauthenticated, allow guest or query-specified unauthenticated ID.
    const userId = authUser ? authUser.id : (searchParams.get("userId") || "default-user");
    const status = searchParams.get("status");

    const where: any = { userId };
    if (status && ["saved", "interested", "in_progress", "completed"].includes(status)) {
      where.status = status;
    }

    const [trackedIssues, recentlyViewed] = await Promise.all([
      prisma.trackedIssue.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.recentlyViewedIssue.findMany({
        where: { userId },
        orderBy: { viewedAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({ trackedIssues, recentlyViewed }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Workspace API error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser(req);
    const body = await req.json();

    // Check if recording recently viewed issue
    if (body.type === "record_view") {
      const targetUserId = authUser ? authUser.id : (body.userId || "default-user");
      const record = await prisma.recentlyViewedIssue.create({
        data: {
          userId: targetUserId,
          issueNumber: body.issueNumber,
          repoOwner: body.repoOwner,
          repoName: body.repoName,
          title: body.title,
          htmlUrl: body.htmlUrl,
          language: body.language || null,
        },
      });
      return NextResponse.json({ success: true, record }, { status: 201 });
    }

    const validation = trackedIssueSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid issue data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;
    // CRITICAL: When authenticated, strictly bind to authenticated user ID.
    // If unauthenticated, fallback to client-supplied guest ID or "default-user".
    const targetUserId = authUser ? authUser.id : (data.userId || "default-user");
    const isPrConfirmed = Boolean(data.prUrl && /github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test(data.prUrl));

    const item = await prisma.trackedIssue.upsert({
      where: {
        userId_repoOwner_repoName_issueNumber: {
          userId: targetUserId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          issueNumber: data.issueNumber,
        },
      },
      update: {
        status: data.status,
        notes: data.notes !== undefined ? data.notes : undefined,
        prUrl: data.prUrl !== undefined ? data.prUrl : undefined,
        isPrConfirmed,
        state: data.state,
      },
      create: {
        userId: targetUserId,
        issueNumber: data.issueNumber,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        title: data.title,
        htmlUrl: data.htmlUrl,
        state: data.state,
        status: data.status,
        notes: data.notes || null,
        labels: data.labels,
        language: data.language || null,
        difficulty: data.difficulty || null,
        prUrl: data.prUrl || null,
        isPrConfirmed,
      },
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Failed to save tracked issue: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser(req);
    const body = await req.json();
    const validation = patchIssueSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid update payload", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { id, status, notes, prUrl } = validation.data;

    // 1. Fetch existing record to verify ownership
    const existing = await prisma.trackedIssue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tracked issue not found" }, { status: 404 });
    }

    // 2. Enforce strict authorization
    if (authUser && existing.userId !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this issue" },
        { status: 403 }
      );
    }

    if (!authUser) {
      // Check if the record belongs to a registered user
      const ownerIsRegistered = await prisma.user.findUnique({ where: { id: existing.userId } });
      if (ownerIsRegistered) {
        return NextResponse.json(
          { error: "Unauthorized: Sign in required to modify personal records" },
          { status: 401 }
        );
      }
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (prUrl !== undefined) {
      updateData.prUrl = prUrl;
      updateData.isPrConfirmed = Boolean(prUrl && /github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test(prUrl));
    }

    const updated = await prisma.trackedIssue.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, item: updated }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Failed to update tracked issue: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing tracked issue id" }, { status: 400 });
    }

    const existing = await prisma.trackedIssue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tracked issue not found" }, { status: 404 });
    }

    // Enforce strict ownership
    if (authUser && existing.userId !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this issue" },
        { status: 403 }
      );
    }

    if (!authUser) {
      const ownerIsRegistered = await prisma.user.findUnique({ where: { id: existing.userId } });
      if (ownerIsRegistered) {
        return NextResponse.json(
          { error: "Unauthorized: Sign in required to delete personal records" },
          { status: 401 }
        );
      }
    }

    await prisma.trackedIssue.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Issue removed from workspace" }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Failed to remove tracked issue: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
