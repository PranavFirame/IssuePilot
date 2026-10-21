import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get("returnUrl") || "/workspace";

  if (!clientId || !clientSecret) {
    // Graceful degradation when Google OAuth credentials are not set in environment
    const redirectUrl = new URL("/auth/signin", req.url);
    redirectUrl.searchParams.set("error", "google_unconfigured");
    return NextResponse.redirect(redirectUrl);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const callbackUrl = `${baseUrl}/api/auth/google/callback`;

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // Set CSRF state cookie (5 minutes expiry)
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  // Set return URL cookie
  response.cookies.set("google_oauth_return_url", returnUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  return response;
}
