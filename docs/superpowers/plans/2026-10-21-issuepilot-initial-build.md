# IssuePilot — Implementation Plan & Architecture

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Design, implement, test, and prepare for production **IssuePilot**, an AI-powered GitHub issue triage and repository intelligence platform for open-source maintainers, engineering teams, and developers.

**Architecture:** Next.js 15 (App Router) with TypeScript, Tailwind CSS, Lucide icons, and Recharts/custom visualizers. Server-side GitHub REST API integration with rate-limit tracking and caching. Pluggable AI triage service with Zod schema validation (Gemini / OpenAI / structured fallback). Deterministic TF-IDF / token-similarity duplicate detection engine. Relational persistence via Prisma (SQLite for zero-config dev/test, PostgreSQL for production) with Docker Compose.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma ORM, Zod, Lucide-React, Vitest, Testing Library.

## Global Constraints
- Strictly validate repository identifiers (`^[a-zA-Z0-9_.-]+$`) and enforce GitHub-only API origin (`https://api.github.com/repos/...`) for SSRF defense.
- Never expose GitHub tokens or AI keys to client bundles.
- Zero-crash fallback when AI keys or external services are not configured: repo analysis, health metrics, filtering, duplicate detection, and exports must remain 100% operational.
- Treat all GitHub repository and issue content as untrusted input: escape rendered markdown, isolate prompt injections with strict boundary tokens.
- No fabricated data or fake reviews. Zero-state vs loading vs error states must be honest and distinct.

## Review Focus
1. **GitHub API rate limit exhaustion**: Unauthenticated requests are limited to 60 req/hr; application must read `x-ratelimit-remaining` and `x-ratelimit-reset` headers and render a polite, actionable banner offering token entry.
2. **Repository not found or private**: Safe error handling with 404/403 status code and guidance for the user.
3. **Massive backlog handling**: Repositories with thousands of issues must paginate or bound requests sensibly without timing out server routes.
4. **Prompt injection via issue title/body**: Isolate user issue text with system prompt safeguards and strict JSON schema output parsing.
5. **No database connection**: Application gracefully handles absent database or falls back to local SQLite/session storage for saved analyses.

---

### Task 1: Project Scaffolding & Configuration
**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`
- Create: `prisma/schema.prisma`, `docker-compose.yml`, `.env.example`, `.gitignore`
- Create: `vitest.config.ts`
- Test: Build and test runner configurations

**Steps:**
- [ ] Initialize Next.js project with App Router, TypeScript, Tailwind CSS, Lucide, and Zod.
- [ ] Configure Prisma schema with models: `SavedAnalysis`, `TriageSnapshot`.
- [ ] Create `.env.example` documenting all configuration options (`GITHUB_TOKEN`, `AI_API_KEY`, `DATABASE_URL`, `AI_PROVIDER`).
- [ ] Configure Vitest for unit & integration testing.

---

### Task 2: Core Domain Logic & Algorithmic Engines
**Files:**
- Create: `lib/github/types.ts`
- Create: `lib/github/url-parser.ts` & `tests/unit/url-parser.test.ts`
- Create: `lib/github/client.ts` & `tests/unit/github-client.test.ts`
- Create: `lib/metrics/health-score.ts` & `tests/unit/health-score.test.ts`
- Create: `lib/triage/duplicates.ts` & `tests/unit/duplicates.test.ts`
- Create: `lib/ai/types.ts`, `lib/ai/schema.ts`, `lib/ai/service.ts` & `tests/unit/ai-service.test.ts`
- Create: `lib/export/formatters.ts` & `tests/unit/export.test.ts`

**Steps:**
- [ ] Implement and test `parseRepositoryUrl` (supports `owner/repo`, `https://github.com/owner/repo`, validates characters).
- [ ] Implement GitHub API client with rate-limit tracking, pagination, and error normalization.
- [ ] Implement repository health metric calculation (stale issue ratio, PR velocity, issue closure rate).
- [ ] Implement token/TF-IDF duplicate issue similarity algorithm with score, shared keywords, and reasoning.
- [ ] Implement AI triage service with Zod schema validation, prompt safety boundaries, and clear unconfigured fallback.
- [ ] Implement CSV and Markdown export generators for issue backlogs and repository summaries.
- [ ] Run tests to verify all algorithmic logic passes.

---

### Task 3: API Route Handlers
**Files:**
- Create: `app/api/analyze/route.ts`
- Create: `app/api/triage/route.ts`
- Create: `app/api/reports/route.ts`
- Create: `tests/integration/api-routes.test.ts`

**Steps:**
- [ ] Implement `/api/analyze` POST handler: validates input, queries GitHub API (or cached/mock for test), computes health metrics, returns unified payload.
- [ ] Implement `/api/triage` POST handler: validates issue details, calls AI provider with structured output or returns unconfigured status.
- [ ] Implement `/api/reports` GET, POST, DELETE handlers for saving and managing analysis snapshots with Prisma/fallback.
- [ ] Write integration tests for API routes with simulated upstream responses.

---

### Task 4: Visual Identity, Layout & Core Components
**Files:**
- Create: `app/globals.css`, `app/layout.tsx`, `components/navbar.tsx`, `components/footer.tsx`
- Create: `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/card.tsx`, `components/ui/tabs.tsx`
- Create: `components/theme-provider.tsx`

**Steps:**
- [ ] Set up cohesive developer-tool styling (zinc/slate surfaces, crisp borders, refined typography, responsive design).
- [ ] Build global navigation with repo search shortcut, quick status, and navigation links.
- [ ] Implement accessible base UI primitives.

---

### Task 5: Feature UI — Landing Page & Analysis Workflow
**Files:**
- Create: `app/page.tsx`
- Create: `components/landing/hero-search.tsx`
- Create: `components/landing/quick-repo-pills.tsx`
- Create: `components/landing/feature-grid.tsx`
- Create: `components/landing/workflow-preview.tsx`

**Steps:**
- [ ] Build high-conversion, honest landing page: repo input form with auto-validation, quick sample repos (`facebook/react`, `vercel/next.js`, `tailwindlabs/tailwindcss`).
- [ ] Feature highlights: Health scoring, AI triage, duplicate detection, CSV/Markdown export.
- [ ] Connect submission to instant analysis and routing.

---

### Task 6: Feature UI — Repository Health Dashboard & Backlog Explorer
**Files:**
- Create: `app/repo/[owner]/[name]/page.tsx`
- Create: `components/dashboard/repo-header.tsx`
- Create: `components/dashboard/health-score-card.tsx`
- Create: `components/dashboard/metrics-overview.tsx`
- Create: `components/dashboard/activity-charts.tsx`
- Create: `components/dashboard/issue-explorer.tsx`
- Create: `components/dashboard/issue-card.tsx`
- Create: `components/dashboard/issue-filter-bar.tsx`

**Steps:**
- [ ] Build repository overview header with stars, forks, language, open issues, PRs, and GitHub external link.
- [ ] Build health metrics overview (open vs closed ratio, stale issue percentage, response velocity).
- [ ] Build issue explorer with search query, state filter (open/closed/all), label filter pills, sort order, and pagination.
- [ ] Synchronize search and filter state with URL parameters for shareable views.

---

### Task 7: Feature UI — AI Triage & Duplicate Detection Panels
**Files:**
- Create: `components/triage/ai-triage-modal.tsx`
- Create: `components/triage/duplicate-detector.tsx`
- Create: `components/triage/triage-badge.tsx`
- Create: `components/reports/export-menu.tsx`
- Create: `components/reports/saved-reports-modal.tsx`

**Steps:**
- [ ] Build AI Triage Drawer / Modal: shows category, priority, confidence reasoning, missing info checklist, and suggested labels.
- [ ] Handle unconfigured AI state with clean explanation and setup instructions.
- [ ] Build Duplicate Detection view: compares backlog issues, shows match score %, shared keywords, side-by-side comparison, and link to GitHub.
- [ ] Build Export Menu: instant download of Backlog CSV and Repository Summary Markdown, plus Save Snapshot button.
- [ ] Build Saved Analyses drawer allowing users to browse, reload, or delete past repository snapshots.

---

### Task 8: Verification, End-to-End Testing & Hardening
**Files:**
- Create: `tests/e2e/user-journey.test.ts`
- Run linting, TypeScript compilation check (`tsc --noEmit`), Vitest suite.
- Security audit: SSRF protection, prompt injection barriers, rate-limit warnings, safe markdown.

**Steps:**
- [ ] Execute complete automated test suite and record evidence.
- [ ] Run production build (`npm run build`) and verify zero type/compilation errors.
- [ ] Verify accessibility, responsiveness, empty states, and error handling.

---

### Task 9: Documentation & Delivery
**Files:**
- Create: `README.md`
- Create: `.github/workflows/ci.yml`
- Create: `docs/architecture.md`
- Create: `docs/api.md`

**Steps:**
- [ ] Write detailed, clear README with setup, configuration, Docker instructions, and architecture overview.
- [ ] Write CI workflow file for GitHub Actions.
- [ ] Prepare final evidence-based report.
