import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { extractGuestId } from "@/lib/auth/guest-session";
import { migrateGuestData } from "@/lib/auth/guest-migration";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const storedState = req.cookies.get("google_oauth_state")?.value;
  const returnUrl = req.cookies.get("google_oauth_return_url")?.value || "/workspace";

  const signinUrl = new URL("/auth/signin", req.url);

  // Clear OAuth cookies on response
  const clearOAuthCookies = (res: NextResponse) => {
    res.cookies.delete("google_oauth_state");
    res.cookies.delete("google_oauth_return_url");
  };

  if (oauthError) {
    signinUrl.searchParams.set("error", "google_oauth_denied");
    const res = NextResponse.redirect(signinUrl);
    clearOAuthCookies(res);
    return res;
  }

  if (!code || !state || state !== storedState) {
    signinUrl.searchParams.set("error", "invalid_state");
    const res = NextResponse.redirect(signinUrl);
    clearOAuthCookies(res);
    return res;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    signinUrl.searchParams.set("error", "google_unconfigured");
    const res = NextResponse.redirect(signinUrl);
    clearOAuthCookies(res);
    return res;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const callbackUrl = `${baseUrl}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      signinUrl.searchParams.set(
        "error",
        tokenData.error_description || tokenData.error || "google_token_exchange_failed"
      );
      const res = NextResponse.redirect(signinUrl);
      clearOAuthCookies(res);
      return res;
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    // 2. Fetch Google User Profile
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      signinUrl.searchParams.set("error", "google_profile_failed");
      const res = NextResponse.redirect(signinUrl);
      clearOAuthCookies(res);
      return res;
    }

    const googleProfile = await userRes.json();
    const googleId = String(googleProfile.sub);
    const email = googleProfile.email;

    if (!email) {
      signinUrl.searchParams.set("error", "google_email_missing");
      const res = NextResponse.redirect(signinUrl);
      clearOAuthCookies(res);
      return res;
    }

    // 3. Find or Create User
    // First, check if an existing Account links to this Google ID
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleId,
        },
      },
      include: { user: true },
    });

    let user = existingAccount?.user;

    // If not found by Account, check by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
      }) as any;
    }

    if (!user) {
      // Create new registered user
      user = await prisma.user.create({
        data: {
          email,
          name: googleProfile.name || email.split("@")[0],
          avatarUrl: googleProfile.picture || null,
          isVerified: Boolean(googleProfile.email_verified),
        },
      });

      // Initialize default preferences
      await prisma.userPreference.create({
        data: {
          userId: user.id,
          languages: JSON.stringify(["TypeScript", "JavaScript", "Python"]),
          experienceLevel: "beginner",
          topics: JSON.stringify(["web", "react", "tools"]),
          monthlyGoal: 3,
        },
      }).catch(() => {});
    } else {
      // Update profile picture or name if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          avatarUrl: user.avatarUrl || googleProfile.picture || null,
          name: user.name || googleProfile.name || null,
        },
      });
    }

    // 4. Upsert Account Record
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleId,
        },
      },
      update: {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined,
        tokenType: tokenData.token_type || null,
        scope: tokenData.scope || null,
      },
      create: {
        userId: user.id,
        provider: "google",
        providerAccountId: googleId,
        accessToken,
        refreshToken: refreshToken || null,
        expiresAt: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null,
        tokenType: tokenData.token_type || null,
        scope: tokenData.scope || null,
      },
    });

    // 5. Create Session & Set Cookie
    const { sessionToken, expiresAt } = await createSession(user.id);

    const redirectTarget = returnUrl.startsWith("/") ? returnUrl : "/workspace";
    const res = NextResponse.redirect(new URL(redirectTarget, req.url));
    setSessionCookie(sessionToken, expiresAt, res);
    clearOAuthCookies(res);

    // Safely migrate any guest data the visitor created before signing in via Google
    const guestId = extractGuestId(req);
    if (guestId) {
      await migrateGuestData(guestId, user.id, res);
    }

    return res;
  } catch (error: unknown) {
    signinUrl.searchParams.set("error", "oauth_unexpected_error");
    const res = NextResponse.redirect(signinUrl);
    clearOAuthCookies(res);
    return res;
  }
}
