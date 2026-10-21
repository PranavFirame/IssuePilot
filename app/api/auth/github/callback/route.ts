import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSession, setSessionCookie } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const storedState = req.cookies.get("github_oauth_state")?.value;
  const returnUrl = req.cookies.get("github_oauth_return_url")?.value || "/workspace";

  const signinUrl = new URL("/auth/signin", req.url);

  // Clear OAuth cookies on response
  const clearOAuthCookies = (res: NextResponse) => {
    res.cookies.delete("github_oauth_state");
    res.cookies.delete("github_oauth_return_url");
  };

  if (oauthError) {
    signinUrl.searchParams.set("error", "oauth_denied");
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

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    signinUrl.searchParams.set("error", "github_unconfigured");
    const res = NextResponse.redirect(signinUrl);
    clearOAuthCookies(res);
    return res;
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      signinUrl.searchParams.set("error", tokenData.error_description || "oauth_token_exchange_failed");
      const res = NextResponse.redirect(signinUrl);
      clearOAuthCookies(res);
      return res;
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch GitHub User Profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "IssuePilot-App",
      },
    });

    if (!userRes.ok) {
      signinUrl.searchParams.set("error", "github_profile_failed");
      const res = NextResponse.redirect(signinUrl);
      clearOAuthCookies(res);
      return res;
    }

    const githubProfile = await userRes.json();
    const githubId = String(githubProfile.id);

    // 3. Resolve primary email
    let email = githubProfile.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "IssuePilot-App",
        },
      });
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primary = emails.find((e: any) => e.primary && e.verified) || emails[0];
        if (primary) email = primary.email;
      }
    }

    if (!email) {
      email = `${githubProfile.login}@users.noreply.github.com`;
    }

    // 4. Find or Create User
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ githubId }, { email }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: githubProfile.name || githubProfile.login,
          avatarUrl: githubProfile.avatar_url,
          bio: githubProfile.bio || null,
          githubId,
          githubUsername: githubProfile.login,
          isVerified: true,
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
      // Update GitHub profile info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          githubId,
          githubUsername: githubProfile.login,
          avatarUrl: user.avatarUrl || githubProfile.avatar_url,
          name: user.name || githubProfile.name || githubProfile.login,
        },
      });
    }

    // 5. Upsert Account Record
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: githubId,
        },
      },
      update: {
        accessToken,
        scope: tokenData.scope || null,
      },
      create: {
        userId: user.id,
        provider: "github",
        providerAccountId: githubId,
        accessToken,
        scope: tokenData.scope || null,
      },
    });

    // 6. Create Session & Set Cookie
    const { sessionToken, expiresAt } = await createSession(user.id);

    const redirectTarget = returnUrl.startsWith("/") ? returnUrl : "/workspace";
    const res = NextResponse.redirect(new URL(redirectTarget, req.url));
    setSessionCookie(sessionToken, expiresAt, res);
    clearOAuthCookies(res);
    return res;
  } catch (error: unknown) {
    signinUrl.searchParams.set("error", "oauth_unexpected_error");
    const res = NextResponse.redirect(signinUrl);
    clearOAuthCookies(res);
    return res;
  }
}
