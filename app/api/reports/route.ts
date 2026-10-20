import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const saveReportSchema = z.object({
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(100),
  repoName: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
  openIssues: z.number().int().nonnegative(),
  openPrs: z.number().int().nonnegative(),
  healthScore: z.number().int().min(0).max(100),
  primaryLanguage: z.string().nullable().optional(),
  dataSnapshot: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const report = await prisma.savedAnalysis.findUnique({
        where: { id },
      });

      if (!report) {
        return NextResponse.json({ error: "Saved report not found" }, { status: 404 });
      }

      return NextResponse.json(report, { status: 200 });
    }

    // List recent saved analyses
    const reports = await prisma.savedAnalysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
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
      },
    });

    return NextResponse.json(reports, { status: 200 });
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

    const saved = await prisma.savedAnalysis.create({
      data: {
        owner,
        repo,
        repoName,
        description: description || null,
        stars,
        forks,
        openIssues,
        openPrs,
        healthScore,
        primaryLanguage: primaryLanguage || null,
        dataSnapshot,
      },
    });

    return NextResponse.json({ success: true, report: saved }, { status: 201 });
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing report id" }, { status: 400 });
    }

    await prisma.savedAnalysis.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Report deleted successfully" }, { status: 200 });
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
