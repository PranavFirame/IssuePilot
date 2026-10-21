import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseRepositoryUrl } from "@/lib/github/url-parser";
import { GitHubApiError, GitHubClient } from "@/lib/github/client";
import { getFallbackRepoPayload } from "@/lib/github/fallback-data";
import { resolveSessionOrGuest } from "@/lib/auth/guest-session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { prisma } from "@/lib/db/prisma";
import { RepositoryAnalysisPayload } from "@/lib/github/types";

const analyzeRequestSchema = z.object({
  repo: z.string().min(1).max(300),
  bypassCache: z.boolean().optional(),
});

async function autoSaveAnalysis(
  payload: RepositoryAnalysisPayload,
  userId: string
): Promise<string | undefined> {
  try {
    const { repository, health } = payload;
    const existing = await prisma.savedAnalysis.findFirst({
      where: {
        userId,
        owner: repository.owner,
        repo: repository.repo,
      },
    });

    if (existing) {
      const updated = await prisma.savedAnalysis.update({
        where: { id: existing.id },
        data: {
          repoName: repository.fullName,
          description: repository.description || null,
          stars: Math.max(0, Math.round(repository.stars || 0)),
          forks: Math.max(0, Math.round(repository.forks || 0)),
          openIssues: Math.max(0, Math.round(repository.openIssuesCount || 0)),
          openPrs: Math.max(0, Math.round(repository.openPrCount || 0)),
          healthScore: Math.max(0, Math.min(100, Math.round(health.score || 0))),
          primaryLanguage: repository.language || null,
          dataSnapshot: JSON.stringify(payload),
          updatedAt: new Date(),
        },
      });
      return updated.id;
    } else {
      const created = await prisma.savedAnalysis.create({
        data: {
          userId,
          owner: repository.owner,
          repo: repository.repo,
          repoName: repository.fullName,
          description: repository.description || null,
          stars: Math.max(0, Math.round(repository.stars || 0)),
          forks: Math.max(0, Math.round(repository.forks || 0)),
          openIssues: Math.max(0, Math.round(repository.openIssuesCount || 0)),
          openPrs: Math.max(0, Math.round(repository.openPrCount || 0)),
          healthScore: Math.max(0, Math.min(100, Math.round(health.score || 0))),
          primaryLanguage: repository.language || null,
          dataSnapshot: JSON.stringify(payload),
        },
      });
      return created.id;
    }
  } catch (err) {
    console.error("Auto-save analysis error:", err);
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  let parsedOwner = "";
  let parsedRepo = "";

  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`analyze:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many analysis requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = analyzeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload. 'repo' is required.",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const parseResult = parseRepositoryUrl(validation.data.repo);
    if (!parseResult.isValid || !parseResult.data) {
      return NextResponse.json(
        { error: parseResult.error || "Invalid repository identifier." },
        { status: 400 }
      );
    }

    const { owner, repo } = parseResult.data;
    parsedOwner = owner;
    parsedRepo = repo;

    const session = await resolveSessionOrGuest(req);
    const userId = session.userId;

    const client = new GitHubClient();

    const analysis = await client.analyzeRepository(owner, repo, {
      bypassCache: validation.data.bypassCache,
    });

    // Automatically persist analyzed data so user never loses it
    const savedId = await autoSaveAnalysis(analysis, userId);

    const res = NextResponse.json({ ...analysis, savedAnalysisId: savedId }, { status: 200 });
    return session.attachCookie(res);
  } catch (error: unknown) {
    if (error instanceof GitHubApiError) {
      if (error.isRateLimit && parsedOwner && parsedRepo) {
        // Provide immediate functional fallback so maintainers can test the UI without blocking
        const fallback = getFallbackRepoPayload(parsedOwner, parsedRepo);
        const session = await resolveSessionOrGuest(req);
        const userId = session.userId;
        const savedId = await autoSaveAnalysis(fallback, userId);

        const res = NextResponse.json(
          {
            ...fallback,
            savedAnalysisId: savedId,
            isDemoFallback: true,
            warning: error.message,
            resetAt: error.resetAt,
          },
          { status: 200 }
        );
        return session.attachCookie(res);
      }

      return NextResponse.json(
        {
          error: error.message,
          isRateLimit: error.isRateLimit,
          resetAt: error.resetAt,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: `Internal server error analyzing repository: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
