import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get("returnUrl") || "/workspace";

  if (!clientId || !clientSecret) {
    // Graceful degradation when OAuth credentials are not set in environment
    const redirectUrl = new URL("/auth/signin", req.url);
    redirectUrl.searchParams.set(
      "error",
      "github_unconfigured"
    );
    return NextResponse.redirect(redirectUrl);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const callbackUrl = `${baseUrl}/api/auth/github/callback`;

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  githubAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubAuthUrl.toString());

  // Set CSRF state cookie (5 minutes expiry)
  response.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  // Set return URL cookie
  response.cookies.set("github_oauth_return_url", returnUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  return response;
}
