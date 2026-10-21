import { describe, it, expect, afterAll } from "vitest";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { GET as meHandler } from "@/app/api/auth/me/route";
import { POST as forgotPasswordHandler } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "@/app/api/auth/reset-password/route";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

describe("Authentication Route Handlers", () => {
  const uniqueId = Date.now();
  const testEmail = `routes_test_${uniqueId}@example.com`;
  const testPassword = "Password123!Secure";
  let sessionCookie: string;
  let resetToken: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => {});
    await prisma.verificationToken.deleteMany({ where: { identifier: testEmail } }).catch(() => {});
  });

  it("POST /api/auth/register registers a new user and sets session cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: "Route Test User",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.email).toBe(testEmail);
    expect(json.user.name).toBe("Route Test User");

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("issuepilot_session=");
    // Extract session cookie for subsequent authenticated tests
    const match = setCookie?.match(/issuepilot_session=([^;]+)/);
    expect(match).not.toBeNull();
    sessionCookie = match ? match[0] : "";
  });

  it("POST /api/auth/register rejects duplicate email with 409 Conflict", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: "Duplicate User",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already exists");
  });

  it("POST /api/auth/login validates credentials and sets session cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.email).toBe(testEmail);
    expect(res.headers.get("set-cookie")).toContain("issuepilot_session=");
  });

  it("POST /api/auth/login rejects incorrect password with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "IncorrectPassword999!",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Invalid email or password");
  });

  it("GET /api/auth/me returns current user when authenticated with session cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { Cookie: sessionCookie },
    });

    const res = await meHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authenticated).toBe(true);
    expect(json.user.email).toBe(testEmail);
  });

  it("GET /api/auth/me returns unauthenticated state when cookie is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/me");
    const res = await meHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authenticated).toBe(false);
    expect(json.user).toBeNull();
  });

  it("POST /api/auth/forgot-password creates a reset token", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });

    const res = await forgotPasswordHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.resetToken).toBeDefined();
    resetToken = json.resetToken;
  });

  it("POST /api/auth/reset-password updates password using token", async () => {
    const newPassword = "BrandNewPassword456!Secure";
    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: resetToken,
        newPassword,
      }),
    });

    const res = await resetPasswordHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    // Verify login with new password succeeds
    const loginReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword,
      }),
    });
    const loginRes = await loginHandler(loginReq);
    expect(loginRes.status).toBe(200);
  });

  it("POST /api/auth/logout invalidates session and clears cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });

    const res = await logoutHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("issuepilot_session=");
  });
});
