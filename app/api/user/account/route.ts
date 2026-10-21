import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerAuthUser, clearSessionCookie } from "@/lib/auth/session";

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized: Sign in required" }, { status: 401 });
    }

    const userId = authUser.id;

    // Delete personal records
    await prisma.$transaction([
      prisma.trackedIssue.deleteMany({ where: { userId } }),
      prisma.recentlyViewedIssue.deleteMany({ where: { userId } }),
      prisma.userPreference.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    const res = NextResponse.json(
      { success: true, message: "Your account and personal data have been permanently deleted." },
      { status: 200 }
    );
    clearSessionCookie(res);
    return res;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Account deletion failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized: Sign in required" }, { status: 401 });
    }

    const body = await req.json();
    if (body.action === "clear_data") {
      const userId = authUser.id;
      await prisma.$transaction([
        prisma.trackedIssue.deleteMany({ where: { userId } }),
        prisma.recentlyViewedIssue.deleteMany({ where: { userId } }),
      ]);

      return NextResponse.json(
        { success: true, message: "Personal bookmarks and history cleared successfully." },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Clear data failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
