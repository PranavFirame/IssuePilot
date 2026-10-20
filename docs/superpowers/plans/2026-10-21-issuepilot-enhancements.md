# IssuePilot — Feature Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance IssuePilot into a production-ready discovery platform for beginner-friendly open-source GitHub issues, personal workspace tracking (Saved, Interested, In Progress, Completed), explainable recommendation matching, repository health signals, and lightweight contribution progress tracking, while strictly preserving the existing space-inspired visual identity, tokens, and components.

**Architecture:** Next.js 15 App Router with TypeScript and Tailwind CSS. GitHub Search REST API integration (`/search/issues`) with query builder, rate-limit awareness, and in-memory cache. Prisma database expansion (`TrackedIssue`, `UserPreference`, `ContributionGoal`) with unified server and local-first fallback persistence. Transparent heuristic match scoring engine.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma ORM, Zod, Lucide-React, Vitest.

---

## Global Constraints
- **Preserve Existing UI/UX**: Retain the space-dark navy background (`224 40% 5%`), cards (`224 35% 8%`), blue/indigo/cyan accents, subtle borders (`223 25% 15%`), glassmorphic headers, and typography.
- **Zero Redesign**: Reuse existing UI primitives (`Button`, `Badge`, `Card`, `Input`, `Navbar`, `Footer`, `ThemeProvider`). New views must feel 100% native to IssuePilot.
- **Unauthenticated Grace**: Browsing, filtering, recommendations, bookmarking, and progress tracking must function immediately without mandatory authentication (local-first storage with database synchronization).
- **Explainable Heuristics**: Match scores are transparently broken down by factors (language match, difficulty label, repository popularity, recent activity). Never disguise heuristics as AI certainty.
- **No Data Fabrication**: Live GitHub Search API results only. Clearly distinguish unverified manual contributions from verified GitHub PRs.

---

## Review Focus
1. **GitHub Search API Rate Limiting**: Search API has a distinct rate limit (30 req/min for authenticated, 10 req/min for unauthenticated). Client must throttle, cache queries, and display polite rate-limit recovery feedback.
2. **Filter Preservation in URL**: Filter states (`lang`, `difficulty`, `sort`, `q`, `page`) must synchronize with URL search params to ensure shareable and refresh-resilient queries.
3. **Workspace State Persistence**: Issue status transitions (`Saved` -> `Interested` -> `In Progress` -> `Completed`) and personal notes must persist across reloads and tab navigations.
4. **Verified vs Manual PR Contributions**: Contribution tracker must validate PR URLs (`https://github.com/owner/repo/pull/123`) and visibly distinguish manually marked completions from confirmed PR links.
5. **Responsive and Accessible Layouts**: Issue cards, difficulty badges, and workspace kanban/list views must collapse gracefully on mobile screens without clipping or overflow.

---

### Task 1: Data Model & Backend API Expansion
**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/github/search.ts`
- Create: `lib/recommendations/matcher.ts`
- Create: `app/api/explore/route.ts`
- Create: `app/api/workspace/route.ts`
- Create: `tests/unit/search-query.test.ts`
- Create: `tests/unit/recommendations.test.ts`

**Steps:**
- [ ] Add `TrackedIssue`, `UserPreference`, `ContributionItem` to `prisma/schema.prisma` and push to SQLite database (`npx prisma db push`).
- [ ] Implement GitHub Search client for beginner-friendly issues (`good first issue`, `help wanted`, `documentation`, `beginner`) with language, activity, and sort filters.
- [ ] Implement transparent recommendation matching algorithm based on user language preferences, experience level, and topic affinities.
- [ ] Implement `/api/explore` Route Handler with validation, rate-limit header tracking, and caching.
- [ ] Implement `/api/workspace` Route Handler (GET, POST, PATCH, DELETE) for managing tracked issues, personal notes, and contribution states.
- [ ] Write and verify unit tests for search query builder and recommendation engine.

---

### Task 2: Priority 1 — Explore Beginner Issues Hub
**Files:**
- Modify: `components/navbar.tsx` (Add navigation links for "Explore", "Analyzer", "Workspace")
- Create: `app/explore/page.tsx`
- Create: `components/explore/issue-search-bar.tsx`
- Create: `components/explore/filter-panel.tsx`
- Create: `components/explore/beginner-issue-card.tsx`
- Create: `components/explore/difficulty-badge.tsx`

**Steps:**
- [ ] Build `/explore` page featuring the space-inspired navy styling, glassmorphic header, and responsive layout.
- [ ] Build filter panel: language selector (TypeScript, Python, Go, Rust, JavaScript, Java, C++, Ruby, etc.), difficulty tags (`good first issue`, `help wanted`, `documentation`), and sort controls (Recently Updated, Most Commented, Newest, Repository Stars).
- [ ] Build `BeginnerIssueCard` displaying:
  - Difficulty badge with distinct color (Good First Issue in emerald, Help Wanted in indigo, Docs in cyan)
  - Repository owner/name, avatar, stars count, and main programming language
  - Issue title, number, labels, opened date, and last updated freshness indicator
  - Quick action to Track/Save issue to Personal Workspace
  - Direct "View on GitHub" external link
  - "AI Triage" trigger button
- [ ] Synchronize filters with URL search parameters (`useSearchParams` & `useRouter`).
- [ ] Add skeleton loading states, empty search results, and API rate-limit warning banners.

---

### Task 3: Priority 2 & 5 — Personal Workspace & Contribution Tracker
**Files:**
- Create: `app/workspace/page.tsx`
- Create: `components/workspace/tracked-issue-card.tsx`
- Create: `components/workspace/notes-modal.tsx`
- Create: `components/workspace/contribution-stats.tsx`
- Create: `components/workspace/link-pr-modal.tsx`
- Create: `lib/workspace/storage.ts`

**Steps:**
- [ ] Implement local-first storage utility with Prisma backend synchronization (`lib/workspace/storage.ts`).
- [ ] Build `/workspace` page supporting:
  - Status tabs / columns: `Saved`, `Interested`, `In Progress`, `Completed`
  - Recently Viewed issues carousel/list
  - Status transition dropdown on each card
  - Personal note editor modal
- [ ] Build `ContributionStats` displaying:
  - Total issues tracked, currently in progress, and completed
  - Optional monthly contribution goal indicator
  - Verified GitHub PR badge vs manually marked completion
  - Link PR modal (validates and attaches pull request URL)

---

### Task 4: Priority 3 & 4 — Recommendations & Repository Health Signals
**Files:**
- Create: `components/recommendations/preference-modal.tsx`
- Create: `components/recommendations/match-reason-badge.tsx`
- Create: `components/dashboard/freshness-indicator.tsx`
- Modify: `components/explore/beginner-issue-card.tsx` (Add match score & reason pill)

**Steps:**
- [ ] Build User Preferences Modal allowing selection of programming languages, experience level (Beginner/Intermediate/Advanced), and framework interests.
- [ ] Compute explainable match score percentage (e.g., "92% Match: TypeScript (+35%), Good First Issue (+30%), Active repo (+20%), Recent (+7%)").
- [ ] Add repository freshness indicator (Recent Activity <7d, Moderate <60d, Stale >90d) without false abandonment claims.

---

### Task 5: Testing, Type Checks & Verification
**Files:**
- Create: `tests/e2e/explore-workspace.test.ts`
- Run: `npx tsc --noEmit`
- Run: `npm test`
- Run: `npm run build`
- Run: `node scripts/test-local.mjs`

**Steps:**
- [ ] Write integration test verifying search query generation, issue tracking lifecycle, and recommendation matching.
- [ ] Run full test suite with Vitest and confirm all tests pass.
- [ ] Verify zero TypeScript compiler errors.
- [ ] Verify production Next.js build passes cleanly.
- [ ] Verify responsive layout and accessibility.
