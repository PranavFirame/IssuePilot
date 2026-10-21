import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET as googleInitHandler } from "@/app/api/auth/google/route";
import { GET as googleCallbackHandler } from "@/app/api/auth/google/callback/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

describe("Google OAuth Integration Tests", () => {
  const originalEnv = { ...process.env };
  const mockEmail = `test_google_${Date.now()}@example.com`;
  const mockGoogleId = `google_sub_${Date.now()}`;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
    await prisma.account.deleteMany({
      where: { provider: "google", providerAccountId: mockGoogleId },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { email: mockEmail },
    }).catch(() => {});
  });

  describe("GET /api/auth/google (Initiation)", () => {
    it("redirects to signin with google_unconfigured when credentials are not set", async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const req = new NextRequest("http://localhost:3000/api/auth/google");
      const res = await googleInitHandler(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/auth/signin");
      expect(location).toContain("error=google_unconfigured");
    });

    it("redirects to Google OAuth authorization URL when configured", async () => {
      process.env.GOOGLE_CLIENT_ID = "mock-google-client-id";
      process.env.GOOGLE_CLIENT_SECRET = "mock-google-client-secret";

      const req = new NextRequest("http://localhost:3000/api/auth/google?returnUrl=/profile");
      const res = await googleInitHandler(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("accounts.google.com/o/oauth2/v2/auth");
      expect(location).toContain("client_id=mock-google-client-id");
      expect(location).toContain("scope=openid+email+profile");

      const cookies = res.headers.get("set-cookie");
      expect(cookies).toContain("google_oauth_state=");
      expect(cookies).toContain("google_oauth_return_url=");
    });
  });

  describe("GET /api/auth/google/callback (Callback & Account Linking)", () => {
    it("redirects with google_oauth_denied when error is returned by Google", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/google/callback?error=access_denied");
      const res = await googleCallbackHandler(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/auth/signin");
      expect(location).toContain("error=google_oauth_denied");
    });

    it("rejects callback with invalid_state when CSRF token is mismatched", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/google/callback?code=mock_code&state=fake_state");
      const res = await googleCallbackHandler(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/auth/signin");
      expect(location).toContain("error=invalid_state");
    });

    it("successfully creates user, links google account, and sets session on valid callback", async () => {
      process.env.GOOGLE_CLIENT_ID = "mock-google-client-id";
      process.env.GOOGLE_CLIENT_SECRET = "mock-google-client-secret";

      const mockState = "valid_secure_state_123";

      // Mock Google Token & UserInfo endpoints
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("oauth2.googleapis.com/token")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              access_token: "mock_google_access_token_abc",
              token_type: "Bearer",
              expires_in: 3600,
              scope: "openid email profile",
            }),
          });
        }
        if (url.includes("googleapis.com/oauth2/v3/userinfo")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              sub: mockGoogleId,
              email: mockEmail,
              email_verified: true,
              name: "Google Explorer",
              picture: "https://lh3.googleusercontent.com/a/mock-pic",
            }),
          });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

      vi.stubGlobal("fetch", mockFetch);

      const req = new NextRequest(
        `http://localhost:3000/api/auth/google/callback?code=valid_mock_code&state=${mockState}`,
        {
          headers: {
            cookie: `google_oauth_state=${mockState}; google_oauth_return_url=/workspace`,
          },
        }
      );

      const res = await googleCallbackHandler(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/workspace");

      // Verify session cookie was attached
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("issuepilot_session=");

      // Verify user was created in the database
      const dbUser = await prisma.user.findUnique({
        where: { email: mockEmail },
        include: { accounts: true },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.name).toBe("Google Explorer");
      expect(dbUser?.isVerified).toBe(true);

      // Verify account record was linked
      expect(dbUser?.accounts.length).toBe(1);
      expect(dbUser?.accounts[0].provider).toBe("google");
      expect(dbUser?.accounts[0].providerAccountId).toBe(mockGoogleId);
    });
  });
});
