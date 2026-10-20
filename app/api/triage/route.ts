import { NextRequest, NextResponse } from "next/server";
import { triageRequestSchema } from "@/lib/ai/schema";
import { triageIssue } from "@/lib/ai/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = triageRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid triage payload",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const triageResult = await triageIssue(validation.data);

    if (!triageResult.success) {
      // If AI is not configured, return 200 with clear unconfigured metadata
      // so the client can present a smooth, informative UI rather than a jarring network crash
      return NextResponse.json(
        {
          success: false,
          isConfigured: triageResult.isConfigured,
          error: triageResult.error,
        },
        { status: triageResult.isConfigured ? 502 : 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        isConfigured: true,
        data: triageResult.result,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: `Triage server error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
