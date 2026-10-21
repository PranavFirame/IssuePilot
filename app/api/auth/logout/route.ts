import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, invalidateSession, clearSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      await invalidateSession(sessionToken);
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
    clearSessionCookie(response);
    return response;
  } catch (error: unknown) {
    const response = NextResponse.json({ success: true }, { status: 200 });
    clearSessionCookie(response);
    return response;
  }
}
