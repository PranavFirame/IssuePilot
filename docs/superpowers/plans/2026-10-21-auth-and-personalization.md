# Authentication, User Profiles & Personalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-ready, secure authentication, user profile, and personalized dashboard system for IssuePilot that integrates seamlessly with the existing dark/indigo UI, SQLite/Prisma backend, GitHub API, and recommendation engine.

**Architecture:** A native, zero-external-dependency authentication engine built directly on Next.js 15 App Router route handlers and Prisma ORM, utilizing secure scrypt password hashing, crypto-random session tokens in httpOnly cookies, real GitHub OAuth with CSRF protection, and server-enforced session verification. Personal preferences, issue bookmarks, tracking status, private notes, and recent views are tied strictly to authenticated user IDs with strict server-side authorization checks.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, SQLite, Node.js `crypto` (scrypt, randomBytes, timingSafeEqual), Zod, Lucide React, Vitest.

**Spec:** User request "Mandatory Feature: Authentication, User Profiles & Personalization".

## Global Constraints

- **Design Integrity:** Strictly preserve the existing dark, space-inspired aesthetic (`#060810` background, `#0c1018` card, `#1a2233` border, electric indigo `hsl(239 84% 67%)` accent, Inter typography, glassmorphism).
- **Public Browsing:** Browsing `/`, `/explore`, and `/repo/[owner]/[name]` must remain publicly accessible without requiring sign-in.
- **Server-Side Authorization:** Never trust a client-supplied `userId` in query params or request bodies. Verify sessions on the server from the httpOnly `session_token` cookie.
- **Zero Fabricated Data:** Never invent GitHub stats, fake followers, or phantom commits. Distinguish verified GitHub identity from user-entered profile data.
- **OAuth Graceful Degradation:** When `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are not set in `.env`, display honest configuration guidance rather than fake mock-success behavior.
- **Testing:** All existing 37 tests must remain passing; new unit and integration tests must cover auth, sessions, ownership enforcement, and profile persistence.

## Review Focus

1. **Unauthenticated Access to Protected Mutators:** Reject mutations to user-specific tracked issues or preferences with 401 Unauthorized when no valid session cookie is present.
2. **Cross-Tenant Access Prevention:** User A must receive 404 or 403 when trying to fetch, patch, or delete User B's tracked issue ID.
3. **Invalid or Expired Session Token:** Requests bearing malformed, expired, or revoked session tokens must be treated as unauthenticated without crashing the server.
4. **Credential Security & Timing Attacks:** Password comparisons must use constant-time `crypto.timingSafeEqual` and scrypt salts; passwords must never be stored or logged in plain text.
5. **Concurrent Bookmark / Duplicate Protection:** Upserting tracked issues must safely handle concurrent requests without database constraint crashes.

---

### Task 1: Database Schema Expansion & Migration for Users, Accounts & Sessions

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/unit/auth-models.test.ts`

**Interfaces:**
- Produces: Prisma models `User`, `Account`, `Session`, `VerificationToken`, plus foreign keys on `TrackedIssue`, `UserPreference`, and `RecentlyViewedIssue`.

- [ ] **Step 1: Write the test verifying Prisma model definitions and relations**
- [ ] **Step 2: Run test to verify it fails before schema update**
- [ ] **Step 3: Update `prisma/schema.prisma` with User, Account, Session, VerificationToken, and user relations**
- [ ] **Step 4: Run `npx prisma db push` and `npx prisma generate` to apply schema to `dev.db`**
- [ ] **Step 5: Run tests to verify model compilation and relations pass**
- [ ] **Step 6: Commit**

---

### Task 2: Server-Side Cryptography, Password Hashing & Session Utilities

**Files:**
- Create: `lib/auth/password.ts`
- Create: `lib/auth/session.ts`
- Create: `lib/auth/types.ts`
- Test: `tests/unit/auth-crypto.test.ts`

**Interfaces:**
- `hashPassword(password: string): Promise<string>`
- `verifyPassword(password: string, storedHash: string): Promise<boolean>`
- `createSession(userId: string): Promise<{ sessionToken: string; expiresAt: Date }>`
- `validateSession(sessionToken: string): Promise<{ user: AuthUser; session: Session } | null>`
- `invalidateSession(sessionToken: string): Promise<void>`
- `getServerAuthUser(req?: Request): Promise<AuthUser | null>`

- [ ] **Step 1: Write failing unit tests for password hashing, verification, session creation, and expiration**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement `lib/auth/password.ts` using `node:crypto` scrypt with salts and constant-time comparison**
- [ ] **Step 4: Implement `lib/auth/session.ts` with database session storage, cookie helpers, and expiration checks**
- [ ] **Step 5: Run tests and verify all pass**
- [ ] **Step 6: Commit**

---

### Task 3: Authentication API Routes (Credentials, GitHub OAuth & Session Management)

**Files:**
- Create: `app/api/auth/register/route.ts`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/me/route.ts`
- Create: `app/api/auth/github/route.ts`
- Create: `app/api/auth/github/callback/route.ts`
- Create: `app/api/auth/forgot-password/route.ts`
- Create: `app/api/auth/reset-password/route.ts`
- Create: `app/api/auth/verify-email/route.ts`
- Test: `tests/integration/auth-routes.test.ts`

**Interfaces:**
- `POST /api/auth/register`: `{ email, password, name }` -> `201 Created` + session cookie
- `POST /api/auth/login`: `{ email, password }` -> `200 OK` + session cookie
- `POST /api/auth/logout`: -> `200 OK` + clears session cookie
- `GET /api/auth/me`: -> `200 OK` `{ user }` or `401 Unauthorized`
- `GET /api/auth/github`: -> redirects to GitHub OAuth with state cookie
- `GET /api/auth/github/callback`: exchanges code, fetches profile, links account, sets cookie, redirects

- [ ] **Step 1: Write integration tests for register, login, invalid password, logout, me, and session rejection**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement credentials endpoints (register, login, logout, me, forgot/reset password)**
- [ ] **Step 4: Implement GitHub OAuth flow (initiate and callback with state validation and profile sync)**
- [ ] **Step 5: Run tests and verify all pass**
- [ ] **Step 6: Commit**

---

### Task 4: Secure Server-Side Authorization for Workspace & Preferences APIs

**Files:**
- Modify: `app/api/workspace/route.ts`
- Modify: `app/api/workspace/preferences/route.ts`
- Create: `app/api/user/profile/route.ts`
- Create: `app/api/user/account/route.ts`
- Test: `tests/integration/auth-authorization.test.ts`

**Interfaces:**
- Enforce `getServerAuthUser()` across all mutators.
- Prevent User A from modifying or reading User B's private notes, tracked issues, or preferences.
- Provide `DELETE /api/user/account` for full account deletion and data scrubbing.

- [ ] **Step 1: Write cross-tenant isolation and unauthorized mutation tests**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Update `app/api/workspace/route.ts` to derive userId strictly from session, validating ownership on PATCH & DELETE**
- [ ] **Step 4: Update `app/api/workspace/preferences/route.ts` to bind preferences to authenticated user**
- [ ] **Step 5: Implement `app/api/user/profile/route.ts` (GET/PATCH) and `app/api/user/account/route.ts` (DELETE)**
- [ ] **Step 6: Run tests and verify all pass**
- [ ] **Step 7: Commit**

---

### Task 5: Client-Side Auth Context & Navigation Integration

**Files:**
- Create: `components/auth/auth-provider.tsx`
- Modify: `components/navbar.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/unit/auth-provider.test.tsx`

**Interfaces:**
- `useAuth()` hook providing `{ user, isLoading, isAuthenticated, login, register, logout, refreshUser }`
- Dynamic Navbar: User avatar / dropdown menu when authenticated; Sign In / Get Started buttons when unauthenticated.

- [ ] **Step 1: Write unit tests for AuthProvider state and useAuth hook**
- [ ] **Step 2: Implement `components/auth/auth-provider.tsx`**
- [ ] **Step 3: Wrap `app/layout.tsx` with `AuthProvider`**
- [ ] **Step 4: Update `components/navbar.tsx` to render user avatar dropdown menu or sign-in buttons**
- [ ] **Step 5: Verify build and component tests**
- [ ] **Step 6: Commit**

---

### Task 6: Native Authentication Pages (Sign In, Sign Up, Forgot/Reset Password, Verify Email)

**Files:**
- Create: `app/auth/signin/page.tsx`
- Create: `app/auth/signup/page.tsx`
- Create: `app/auth/forgot-password/page.tsx`
- Create: `app/auth/reset-password/page.tsx`
- Create: `app/auth/verify-email/page.tsx`
- Create: `components/auth/auth-card.tsx`
- Create: `components/auth/github-button.tsx`

**Interfaces:**
- Native UI matching rubens.design dark indigo theme with form validation, loading states, error alerts, redirect callbacks, and GitHub OAuth button.

- [ ] **Step 1: Create reusable `components/auth/auth-card.tsx` and `components/auth/github-button.tsx`**
- [ ] **Step 2: Build `app/auth/signin/page.tsx` supporting credentials, GitHub OAuth, error banners, and returnUrl**
- [ ] **Step 3: Build `app/auth/signup/page.tsx` with password strength indicator and instant login**
- [ ] **Step 4: Build `app/auth/forgot-password/page.tsx` and `app/auth/reset-password/page.tsx`**
- [ ] **Step 5: Build `app/auth/verify-email/page.tsx`**
- [ ] **Step 6: Test forms and verify pages render cleanly**
- [ ] **Step 7: Commit**

---

### Task 7: User Profile Management Page

**Files:**
- Create: `app/profile/page.tsx`
- Create: `components/profile/profile-editor.tsx`
- Create: `components/profile/preferences-editor.tsx`
- Create: `components/profile/security-settings.tsx`
- Test: `tests/e2e/profile-page.test.ts`

**Interfaces:**
- Profile page with verified GitHub badge (avatar, username, link), user display name, biography, preferred languages/frameworks, experience level, goal settings, password update, and account deletion dialog.

- [ ] **Step 1: Write end-to-end test for profile view and update flow**
- [ ] **Step 2: Build `components/profile/profile-editor.tsx` for bio, name, and GitHub badge**
- [ ] **Step 3: Build `components/profile/preferences-editor.tsx` for tech stack, difficulty, and goals**
- [ ] **Step 4: Build `components/profile/security-settings.tsx` for password update, session clearing, and account deletion**
- [ ] **Step 5: Assemble `app/profile/page.tsx` with responsive navigation tabs**
- [ ] **Step 6: Run tests and verify all pass**
- [ ] **Step 7: Commit**

---

### Task 8: Personalized Dashboard Enhancements & Recommendation Feed

**Files:**
- Modify: `app/workspace/page.tsx`
- Create: `components/workspace/personalized-recommendations.tsx`
- Modify: `lib/workspace/storage.ts`
- Test: `tests/e2e/personalized-dashboard.test.ts`

**Interfaces:**
- Workspace elevated into a personalized contributor dashboard:
  - Tab 1: Tracked & Bookmarked Issues (Saved, Interested, In Progress, Completed) with notes and linked PRs
  - Tab 2: Personalized Issue Recommendations tailored to user's saved languages & experience level with match explanations
  - Tab 3: Recently Viewed Issues
  - Tab 4: Contribution Goals & Statistics
  - Graceful first-time user empty states

- [ ] **Step 1: Write test for personalized recommendations and multi-tab dashboard filtering**
- [ ] **Step 2: Implement `components/workspace/personalized-recommendations.tsx` fetching issues matched against user preferences**
- [ ] **Step 3: Update `app/workspace/page.tsx` to support authenticated session sync, recommendations tab, and rich empty states**
- [ ] **Step 4: Update `lib/workspace/storage.ts` to seamlessly sync with authenticated backend session**
- [ ] **Step 5: Run tests and verify all pass**
- [ ] **Step 6: Commit**

---

### Task 9: Full System Verification, Build & Documentation

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Run full test suite: `vitest run`
- Run typecheck: `npx tsc --noEmit`
- Run production build: `npm run build`

- [ ] **Step 1: Document environment variables (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`) in `.env.example` and `README.md`**
- [ ] **Step 2: Run all tests (unit, integration, and E2E)**
- [ ] **Step 3: Run `npx tsc --noEmit` and fix any type discrepancies**
- [ ] **Step 4: Run `npm run build` to verify production compilation**
- [ ] **Step 5: Verify live running server at http://localhost:3000**
- [ ] **Step 6: Commit and push changes to GitHub**
