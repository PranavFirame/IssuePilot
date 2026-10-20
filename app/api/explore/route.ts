import { NextRequest, NextResponse } from "next/server";
import { searchBeginnerIssues, SearchFilters } from "@/lib/github/search";
import { GitHubApiError } from "@/lib/github/client";
import { getFallbackBeginnerIssues } from "@/lib/github/fallback-data";

export async function GET(req: NextRequest) {
  let filterLang = "";
  try {
    const { searchParams } = new URL(req.url);

    filterLang = searchParams.get("lang") || "";
    const filters: SearchFilters = {
      query: searchParams.get("q") || undefined,
      language: searchParams.get("lang") || undefined,
      difficulty: searchParams.get("difficulty") || undefined,
      sort: (searchParams.get("sort") as any) || "updated",
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      perPage: searchParams.get("perPage") ? parseInt(searchParams.get("perPage")!, 10) : 20,
    };

    const results = await searchBeginnerIssues(filters);
    return NextResponse.json(results, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof GitHubApiError) {
      if (error.isRateLimit) {
        // Fallback to sample beginner issues so testing can proceed smoothly
        const fallbackIssues = getFallbackBeginnerIssues(filterLang);
        return NextResponse.json(
          {
            totalCount: fallbackIssues.length,
            incompleteResults: false,
            issues: fallbackIssues,
            isDemoFallback: true,
            rateLimit: {
              limit: 10,
              remaining: 0,
              resetAt: error.resetAt || new Date().toISOString(),
            },
            warning: error.message,
          },
          { status: 200 }
        );
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
        error: `Explore API error: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}

