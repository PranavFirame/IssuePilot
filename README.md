# IssuePilot 🧭
### AI-Powered GitHub Issue Triage and Repository Intelligence Platform

IssuePilot is a production-grade developer platform designed for open-source maintainers, software engineering teams, and developers to discover beginner-friendly issues, analyze public GitHub repositories, evaluate repository health, detect duplicate tickets with deterministic NLP, and personalize their open-source contribution journey.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest)

---

## Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │            Client Browser               │
                      │  Next.js 15 App Router (React 19)       │
                      └────────────────────┬────────────────────┘
                                           │
                        HTTPS / HTTPOnly Secure Cookies
                        (Session Token / Isolated Guest Token)
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           IssuePilot Core API Layer                             │
│                                                                                 │
│   ┌─────────────────────┐   ┌───────────────────────┐   ┌───────────────────┐   │
│   │  Session & Identity │   │  Sliding-Window Rate  │   │  Input Validation │   │
│   │  Resolver / Guest   │   │  Limiter (In-Memory)  │   │  & SSRF Firewall  │   │
│   └──────────┬──────────┘   └───────────┬───────────┘   └─────────┬─────────┘   │
│              │                          │                         │             │
│              └──────────────────────────┼─────────────────────────┘             │
│                                         ▼                                       │
│                       ┌───────────────────────────────────┐                     │
│                       │    Service & Intelligence Logic   │                     │
│                       ├───────────────────────────────────┤                     │
│                       │ • Health Scoring Engine (A+ to F) │                     │
│                       │ • TF-IDF Duplicate Issue Radar    │                     │
│                       │ • Explainable Recommendation Match│                     │
│                       │ • Guest-to-Account Data Migration │                     │
│                       │ • Issue Skills & Breakdown Parser │                     │
│                       └─────────────────┬─────────────────┘                     │
└─────────────────────────────────────────┼───────────────────────────────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
         ┌───────────────────────┐                 ┌───────────────────────┐
         │     Prisma SQLite     │                 │    GitHub REST API    │
         │  Strict Tenant Guard  │                 │    Read-Only Client   │
         │  (Users/Tracks/Prefs) │                 │ (Issues/PRs/Telemetry)│
         └───────────────────────┘                 └───────────────────────┘
```

---

## Key Features

1. **Hardened Security & Isolated Guest Sessions**:
   - **Zero-Shared Identity Fallbacks**: No shared identities. Every unauthenticated visitor receives a cryptographically generated, isolated guest identity (`issuepilot_guest_id`) stored in a secure `httpOnly` cookie.
   - **Server-Side Authorization**: Client-supplied user IDs are strictly rejected as proof of identity; requests query only verified user sessions or the caller's verified guest cookie.
   - **Cross-Tenant Protection**: Strict tenant isolation prevents User A or Guest A from viewing, editing, or deleting User B's or Guest B's tracked issues, notes, or preferences (enforcing 403 Forbidden).
   - **In-Memory Rate Limiting**: Sliding-window rate limiters protect authentication endpoints (`/api/auth/login`, `/api/auth/register`) and upstream GitHub fetch routes (`/api/analyze`) against brute-force and DoS attacks.
   - **SSRF Defense**: Domain-enforced repository parser restricting outgoing HTTP traffic exclusively to `api.github.com`.

2. **Idempotent Guest-to-Account Migration (`/api/auth/migrate-guest`)**:
   - Seamlessly transfers all guest-saved issues, private implementation notes, repository snapshots, and technology preferences into a newly registered or authenticated account upon sign-in.
   - Handles collisions atomically without duplicate records or unique constraint crashes, and automatically purges old guest records.

3. **Contributor Onboarding & Tech Stack Calibration (`/workspace`)**:
   - Interactive modal to calibrate programming languages, experience level (Beginner, Intermediate, Advanced), focus topics, and monthly contribution targets.
   - Dynamic recalibration button in the contributor workspace dashboard with real-time recalculation of recommendation scores.

4. **Issue-to-Contribution Journey & Skill Breakdown**:
   - **Explainable Objective Breakdown**: Plain-language translation of what each issue is asking for.
   - **Heuristic Skill Tagging**: Detects required skills (e.g. React components, TypeScript types, CSS styling, async APIs, unit testing) from issue labels, titles, and body content without false AI certainty.
   - **Contribution Guide Shortcuts**: Direct links to repository `CONTRIBUTING.md` and upstream GitHub tickets.
   - **Contribution Tracker**: Lightweight status progression (`Saved` → `Interested` → `In Progress` → `Completed`) with private notes and verified pull request URL attachment (`https://github.com/owner/repo/pull/123`).

5. **Beginner Issue Discovery Hub (`/explore`)**:
   - Curates open starter issues tagged `good first issue`, `help wanted`, and `documentation`.
   - Filter by language, difficulty, and sorting with shareable, bookmarkable URL queries.

6. **Repository Health & Staleness Scoring (`/repo/[owner]/[name]`)**:
   - Multi-factor health grade (**A+ through F**) and numerical score (0–100) based on push velocity, issue closure ratios, stale backlog volume (>90 days inactive), and pull request turnover.
   - Diagnostic counters for median backlog age, stale issue counts, and PR turnover velocity.

7. **Deterministic Duplicate Radar**:
   - TF-IDF and weighted token cosine similarity vectorizer.
   - Boosts titles with 3x weight, pairs potential duplicate tickets with similarity scores, and highlights shared keywords.

8. **AI-Assisted Issue Triage**:
   - Classifies tickets into bug, feature, docs, question, or enhancement.
   - Recommends priority with clear reasoning and suggested labels.
   - **Zero-Crash Fallback**: If no AI key is configured, all analysis, health scores, duplicate detection, and exports continue functioning without errors.

---

## Authentication Setup & Configuration

### 1. Email & Password Authentication (Ready Out of the Box)
Email authentication functions immediately with zero external service configuration. Passwords are encrypted using native Node.js `scrypt` hashing with unique cryptographic salts.

### 2. GitHub OAuth (Optional)
To enable one-click GitHub login:
1. Navigate to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Fill in:
   - **Application Name**: `IssuePilot`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Copy the **Client ID** and generate a **Client Secret**.
5. Add them to your `.env` file:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```
*If not configured, IssuePilot displays clear in-app guidance and directs users to email/password sign-in.*

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# GitHub API Token (Optional: Increases rate limit from 60 to 5,000 req/hr)
GITHUB_TOKEN=

# GitHub OAuth App Credentials (Optional: Enables 1-click GitHub Sign-In)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI Provider Key (Optional: Enables AI Backlog Triage. Has zero-crash fallback)
GEMINI_API_KEY=
```

---

## Quick Start

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/PranavFirame/IssuePilot.git
cd IssuePilot

# Install dependencies
npm install

# Initialize local SQLite database
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use IssuePilot.

---

## Verification & Test Suite

IssuePilot features 72 automated unit, integration, security, and end-to-end tests:

```bash
# Run the full Vitest suite (72 tests across 16 files)
npm test

# Run TypeScript typecheck
npx tsc --noEmit

# Run Next.js production build
npm run build
```

### Verified Test Categories:
- **Security & Guest Session Isolation**: Proves two separate unauthenticated visitors receive isolated data and cannot mutate or view each other's tracked issues.
- **Cross-Tenant Authorization**: Verifies User B receives 403 Forbidden attempting to read, update, or delete User A's private records.
- **Guest-to-Account Migration**: Proves all guest-created items transfer safely and idempotently to user accounts upon sign-in.
- **Sliding-Window Rate Limiting**: Proves in-memory rate limiter stops abusive traffic after exceeding request quotas.
- **Deterministic Health & Duplicates**: Unit-tested TF-IDF cosine similarity calculations and 4-factor health grading rubric.
- **Cryptographic Security**: Salted `scrypt` hashing, constant-time equality checks, and session expiration handling.
