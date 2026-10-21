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

## Key Features

1. **Production-Ready Authentication & Sessions**:
   - Secure email & password authentication with `scrypt` hashing, random salts, and constant-time comparison.
   - One-click GitHub OAuth 2.0 integration requesting only minimal read permissions (`read:user user:email`).
   - High-entropy cryptographic session tokens stored in secure, `httpOnly`, `SameSite=Lax` cookies.
   - Built-in email verification and password reset workflows.
   - Public exploration remains 100% accessible without sign-in; authentication is required only for personal saved data.

2. **Personal Contributor Profile & Settings (`/profile`)**:
   - Clear visual distinction between verified GitHub profile data and user-entered details.
   - Editable display name, bio (up to 500 characters), and custom avatar URL.
   - Preferred programming languages, focus topics/frameworks, and experience level calibrator.
   - Complete data sovereignty: single-click workspace data purge and permanent account deletion.

3. **Personalized Contributor Dashboard (`/workspace`)**:
   - Multi-tab intelligence hub:
     - **Tracked Issues**: Filter by Saved, Interested, In Progress, and Completed.
     - **Personalized Recommendations**: Issues dynamically scored against your chosen tech stack and experience level with transparent match explanations.
     - **Recently Viewed**: Automatic history of inspected issues.
     - **Goals & Progress**: Monthly contribution target trackers and verified pull request badges.
   - Implementation notes modal and verified PR URL linking (`https://github.com/owner/repo/pull/123`).

4. **Beginner Issue Discovery Hub (`/explore`)**:
   - Curates open starter issues tagged `good first issue`, `help wanted`, and `documentation`.
   - Filter by language (TypeScript, Python, Rust, Go, Java, C++, etc.), difficulty, and sorting.
   - URL-synchronized state for shareable, bookmarkable queries.

5. **Repository Health & Staleness Scoring (`/repo/[owner]/[name]`)**:
   - Multi-factor health grade (**A+ through F**) and numerical score (0–100) based on push velocity, issue closure ratios, stale backlog volume (>90 days inactive), and pull request turnover.
   - Backlog freshness indicators and average/median ticket age.

6. **Deterministic Duplicate Radar**:
   - TF-IDF and weighted token cosine similarity vectorizer.
   - Boosts titles with 3x weight, pairs potential duplicate tickets with similarity scores, and highlights shared keywords.

7. **AI-Assisted Issue Triage**:
   - Classifies tickets into bug, feature, docs, question, or enhancement.
   - Recommends priority with clear reasoning and suggested labels.
   - **Zero-Crash Fallback**: If no AI key is configured, all analysis, health scores, duplicate detection, and exports continue functioning without errors.

8. **Hardened Security Architecture**:
   - **Server-Side Authorization**: API routes strictly verify ownership from session cookies; client-supplied user IDs are never trusted as proof of authorization.
   - **Cross-Tenant Isolation**: Users cannot read, modify, or delete another user's private notes or bookmarks.
   - **SSRF Defense**: Strict regex validation of repository names (`^[a-zA-Z0-9_.-]+$`), restricting outgoing calls solely to `api.github.com`.
   - **Prompt Injection Boundaries**: Issue content is isolated inside XML fences with system constraints.
   - **Read-Only Principles**: Zero write operations are ever requested against user GitHub repositories.

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

## Running the Automated Test Suite

IssuePilot includes unit, integration, and end-to-end tests covering cryptography, database relations, API route handlers, and multi-tenant authorization:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Technology Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS (inspired by rubens.design dark indigo theme, Inter typography)
- **Database & ORM**: SQLite (`dev.db`) with Prisma ORM
- **Authentication**: Native Node.js `crypto` (`scrypt`, `timingSafeEqual`), httpOnly cookies, GitHub OAuth
- **Testing**: Vitest 3.0
