import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseRepositoryUrl } from "@/lib/github/url-parser";
import { GitHubApiError, GitHubClient } from "@/lib/github/client";

const analyzeRequestSchema = z.object({
  repo: z.string().min(1).max(300),
  bypassCache: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
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
    const client = new GitHubClient();

    const analysis = await client.analyzeRepository(owner, repo, {
      bypassCache: validation.data.bypassCache,
    });

    return NextResponse.json(analysis, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof GitHubApiError) {
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
