import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { resolveSessionOrGuest } from "@/lib/auth/guest-session";

const saveReportSchema = z.object({
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(100),
  repoName: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  stars: z.number().nonnegative().optional().default(0),
  forks: z.number().nonnegative().optional().default(0),
  openIssues: z.number().nonnegative().optional().default(0),
  openPrs: z.number().nonnegative().optional().default(0),
  healthScore: z.number().min(0).max(100).optional().default(0),
  primaryLanguage: z.string().nullable().optional(),
  dataSnapshot: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await resolveSessionOrGuest(req);
    const userId = session.userId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const report = await prisma.savedAnalysis.findUnique({
        where: { id },
      });

      if (!report) {
        return NextResponse.json({ error: "Saved report not found" }, { status: 404 });
      }

      // Allow viewing if it's user's own, default/public, or null
      if (report.userId && report.userId !== userId && report.userId !== "default-user") {
        return NextResponse.json({ error: "Forbidden: Access denied to this report" }, { status: 403 });
      }

      const res = NextResponse.json(report, { status: 200 });
      return session.attachCookie(res);
    }

    // List saved analyses for this user/guest and default/public ones
    const where: any = {
      OR: [{ userId }, { userId: "default-user" }, { userId: null }],
    };

    const reports = await prisma.savedAnalysis.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        userId: true,
        owner: true,
        repo: true,
        repoName: true,
        description: true,
        stars: true,
        forks: true,
        openIssues: true,
        openPrs: true,
        healthScore: true,
        primaryLanguage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const res = NextResponse.json(reports, { status: 200 });
    return session.attachCookie(res);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: `Failed to retrieve reports: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await resolveSessionOrGuest(req);
    const userId = session.userId;

    const body = await req.json();
    const validation = saveReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid report data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      owner,
      repo,
      repoName,
      description,
      stars,
      forks,
      openIssues,
      openPrs,
      healthScore,
      primaryLanguage,
      dataSnapshot,
    } = validation.data;

    // Check if user already has an existing analysis of this repo
    const existing = await prisma.savedAnalysis.findFirst({
      where: {
        userId,
        owner,
        repo,
      },
    });

    let saved;
    if (existing) {
      saved = await prisma.savedAnalysis.update({
        where: { id: existing.id },
        data: {
          repoName,
          description: description || null,
          stars: Math.round(stars),
          forks: Math.round(forks),
          openIssues: Math.round(openIssues),
          openPrs: Math.round(openPrs),
          healthScore: Math.round(healthScore),
          primaryLanguage: primaryLanguage || null,
          dataSnapshot,
          updatedAt: new Date(),
        },
      });
    } else {
      saved = await prisma.savedAnalysis.create({
        data: {
          userId,
          owner,
          repo,
          repoName,
          description: description || null,
          stars: Math.round(stars),
          forks: Math.round(forks),
          openIssues: Math.round(openIssues),
          openPrs: Math.round(openPrs),
          healthScore: Math.round(healthScore),
          primaryLanguage: primaryLanguage || null,
          dataSnapshot,
        },
      });
    }

    const res = NextResponse.json({ success: true, report: saved }, { status: 201 });
    return session.attachCookie(res);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: `Failed to save analysis report: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await resolveSessionOrGuest(req);
    const userId = session.userId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing report id" }, { status: 400 });
    }

    const existing = await prisma.savedAnalysis.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Strict authorization check: must belong to the active session
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Cannot delete another user's report" }, { status: 403 });
    }

    await prisma.savedAnalysis.delete({
      where: { id },
    });

    const res = NextResponse.json({ success: true, message: "Report deleted" }, { status: 200 });
    return session.attachCookie(res);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: `Failed to delete report: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
