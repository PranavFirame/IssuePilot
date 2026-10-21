# IssuePilot Production-Ready Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform IssuePilot into a production-ready, secure, and resilient GitHub issue discovery and contributor intelligence platform with verified guest isolation, guest-to-account migration, personal onboarding, enriched issue breakdown, rate limiting, and zero-defect tests.

**Architecture:** Next.js 15 App Router with SQLite (Prisma 6), server-side session authentication with `httpOnly` cryptographic cookies, cryptographically isolated guest sessions (`issuepilot_guest_id`), server-side authorization enforcement on all API routes, in-memory rate limiting, deterministic TF-IDF NLP duplicate radar, and explainable recommendation scoring.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.7, Tailwind CSS 3.4, Prisma 6, Vitest 3.

---

## Task 1: Security & Guest Identity Isolation (Phase 1)

**Files:**
- Create: `lib/auth/guest-session.ts`
- Create: `lib/security/rate-limiter.ts`
- Modify: `app/api/workspace/route.ts`
- Modify: `app/api/workspace/preferences/route.ts`
- Modify: `app/api/reports/route.ts`
- Modify: `lib/workspace/storage.ts`

- [ ] Create `lib/auth/guest-session.ts` with `resolveSessionOrGuest(req)`:
  - If authenticated via `getServerAuthUser(req)`, return `{ isAuthenticated: true, userId: user.id, user }`
  - If guest, read `issuepilot_guest_id` cookie. If missing or invalid format (`^guest_[a-f0-9]{32}$`), generate a new secure random guest ID `guest_${crypto.randomBytes(16).toString("hex")}`.
  - Provide `attachGuestCookie(res, guestId)` setting a secure, `httpOnly`, `SameSite=Lax` cookie with 30-day expiration.
- [ ] Create `lib/security/rate-limiter.ts`:
  - Implement a sliding window in-memory rate limiter with cleanup of stale timestamps.
  - Provide `checkRateLimit(key: string, maxRequests: number, windowSeconds: number): { allowed: boolean; remaining: number; resetAt: number }`.
- [ ] Secure `app/api/workspace/route.ts`:
  - Never trust client-supplied `userId` query parameter or body parameter.
  - `GET`: strictly query for `resolved.userId`. Attach guest cookie if guest.
  - `POST`: bind records strictly to `resolved.userId`. Attach guest cookie if guest.
  - `PATCH`: verify `existing.userId === resolved.userId`. Return 403 Forbidden on mismatch.
  - `DELETE`: verify `existing.userId === resolved.userId`. Return 403 Forbidden on mismatch.
- [ ] Secure `app/api/workspace/preferences/route.ts`:
  - Discard body `userId` and query `userId`.
  - Use `resolved.userId`. Attach guest cookie if guest.
- [ ] Secure `app/api/reports/route.ts`:
  - Apply `resolveSessionOrGuest(req)`.
  - `GET`: for authenticated user, return their reports + public ones; for guest, return only their guest reports.
  - `POST`: bind to `resolved.userId`.
  - `DELETE`: verify `existing.userId === resolved.userId`. Return 403 Forbidden on mismatch.
- [ ] Update `lib/workspace/storage.ts`:
  - Namespace `localStorage` keys to avoid browser cross-session data leaks.

---

## Task 2: Guest-to-Account Migration (Phase 1)

**Files:**
- Create: `lib/auth/guest-migration.ts`
- Create: `app/api/auth/migrate-guest/route.ts`
- Modify: `app/api/auth/login/route.ts`
- Modify: `app/api/auth/register/route.ts`
- Modify: `app/api/auth/github/callback/route.ts`
- Create: `tests/integration/guest-isolation.test.ts`

- [ ] Create `lib/auth/guest-migration.ts`:
  - `migrateGuestData(guestId: string, targetUserId: string, res: NextResponse)`:
    - Atomically transfer `TrackedIssue`, `RecentlyViewedIssue`, `UserPreference`, and `SavedAnalysis` from `guestId` to `targetUserId`.
    - Handle duplicates safely: if `TrackedIssue` already exists under `targetUserId`, update with guest notes if present, without throwing unique constraint violations.
    - If user has default preferences and guest has custom preferences, update user's preferences.
    - Delete remaining records for `guestId`.
    - Clear the `issuepilot_guest_id` cookie on `res`.
- [ ] Integrate migration into `app/api/auth/login/route.ts`, `register/route.ts`, and `github/callback/route.ts`:
  - Read `issuepilot_guest_id` cookie from request. If valid guest ID, execute `migrateGuestData` and return migrated count.
- [ ] Create `app/api/auth/migrate-guest/route.ts` for explicit client-triggered migration if needed.
- [ ] Create `tests/integration/guest-isolation.test.ts`:
  - Test 1: Two separate guests with different cookies cannot see each other's tracked issues.
  - Test 2: User A cannot read, patch, or delete User B's tracked issue (returns 403).
  - Test 3: Attacker cannot access victim's data by passing `?userId=victim`.
  - Test 4: Guest-to-account migration transfers data atomically, without duplicates, and clears guest cookie.
  - Test 5: Rate limiter blocks excessive requests.

---

## Task 3: Personal Onboarding & Experience Calibration (Phase 2)

**Files:**
- Create: `components/workspace/onboarding-modal.tsx`
- Modify: `app/workspace/page.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `lib/recommendations/matcher.ts`

- [ ] Create `components/workspace/onboarding-modal.tsx`:
  - Design using existing dark theme tokens, Inter font, and lucide icons.
  - Fast 3-step setup:
    1. Select primary languages (TypeScript, JavaScript, Python, Go, Rust, Java, C++, Python, PHP).
    2. Choose experience level (Beginner, Intermediate, Advanced).
    3. Choose contribution interests (Bug Fixing, Documentation, Feature Enhancements, Testing, CLI Tools).
  - Single-click action to save directly to `/api/workspace/preferences`.
  - "Skip for now" dismiss action.
- [ ] Connect onboarding to `app/workspace/page.tsx`:
  - If user/guest has default/empty preferences, display friendly onboarding banner or trigger modal.
  - Add "Calibrate Preferences" button in recommendations tab.
- [ ] Verify `lib/recommendations/matcher.ts`:
  - Ensure all matched reasons are clear, concise, and never fabricate scores.

---

## Task 4: Issue-to-Contribution Journey Enhancements (Phase 3)

**Files:**
- Create: `components/workspace/issue-breakdown-card.tsx`
- Modify: `components/workspace/tracked-issue-card.tsx`
- Modify: `components/explore/issue-card.tsx`
- Modify: `app/workspace/page.tsx`

- [ ] Create `components/workspace/issue-breakdown-card.tsx`:
  - Plain-language explanation of what the issue is asking for.
  - Key skills and technologies involved extracted from language and labels.
  - Direct links to GitHub issue and repository `CONTRIBUTING.md`.
  - Heuristic indicator label.
- [ ] Enhance `components/workspace/tracked-issue-card.tsx`:
  - Add quick action to expand issue breakdown.
  - Improve status transition controls (Saved → Interested → In Progress → Completed).
  - Add confirmation dialog before removing a tracked issue.
- [ ] Enhance `components/explore/issue-card.tsx`:
  - Include issue breakdown preview and 1-click tracking.

---

## Task 5: Repository Health & Duplicate Radar Polish (Phase 4)

**Files:**
- Modify: `components/dashboard/repo-header.tsx`
- Modify: `lib/github/health.ts`
- Modify: `lib/github/duplicates.ts`

- [ ] Ensure repository health scoring explanation is transparent:
  - Add a popover or breakdown modal explaining the 4 health grading pillars:
    1. Push Velocity (last commit date & frequency)
    2. Issue Closure Ratio (closed / total)
    3. Backlog Staleness Ratio (>90 days inactive)
    4. Pull Request Turnover Velocity
  - Clearly flag missing/approximate data.
- [ ] Verify Duplicate Radar NLP fallback:
  - Handles repositories with fewer than 2 issues gracefully.
  - Explains overlapping keywords between paired tickets.

---

## Task 6: UI/UX Polish, Accessibility & Responsive Behavior (Phase 5)

**Files:**
- Modify: `app/workspace/page.tsx`
- Modify: `app/explore/page.tsx`
- Modify: `components/navbar.tsx`

- [ ] Verify loading skeletons, empty states, and error retry states across all pages.
- [ ] Check keyboard tab order, `aria-labels`, and focus-visible indicators.
- [ ] Ensure full responsive layouts on mobile, tablet, and desktop without horizontal overflow.

---

## Task 7: Comprehensive Verification & Test Suite (Phase 6)

**Files:**
- Run Vitest suite: `npx vitest run`
- Run TypeScript check: `npx tsc --noEmit`
- Run ESLint: `npm run lint`
- Run Next.js production build: `npm run build`

- [ ] Verify all new and existing tests pass.
- [ ] Verify zero TypeScript errors.
- [ ] Verify zero ESLint warnings or errors.
- [ ] Verify production build completes successfully.

---

## Task 8: Documentation & Portfolio Presentation (Phase 7)

**Files:**
- Modify: `README.md`

- [ ] Update `README.md` with:
  - High-level architecture diagram.
  - Detailed security breakdown (Guest isolation, session auth, rate limiting, zero-trust untrusted content).
  - Local setup and migration instructions.
  - Engineering accomplishments and verified test results.
