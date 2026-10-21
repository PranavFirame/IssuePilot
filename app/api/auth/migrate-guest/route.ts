import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth/session";
import { extractGuestId } from "@/lib/auth/guest-session";
import { migrateGuestData } from "@/lib/auth/guest-migration";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized: Sign in required to migrate data" }, { status: 401 });
    }

    const guestId = extractGuestId(req);
    if (!guestId) {
      return NextResponse.json(
        {
          success: true,
          message: "No guest data found to migrate",
          summary: { migratedIssuesCount: 0, migratedReportsCount: 0, preferencesMigrated: false },
        },
        { status: 200 }
      );
    }

    const res = NextResponse.json({ success: true, message: "Guest data migrated successfully" }, { status: 200 });
    const summary = await migrateGuestData(guestId, authUser.id, res);

    return NextResponse.json({ success: true, summary }, { status: 200, headers: res.headers });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Migration failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
