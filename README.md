# IssuePilot 🧭
### AI-Powered GitHub Issue Triage and Repository Intelligence Platform

IssuePilot is a production-grade developer platform designed for open-source maintainers, software engineering teams, and developers to analyze public GitHub repositories, evaluate repository health, detect duplicate tickets with deterministic NLP, and triage incoming backlog items with structured AI models.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest)

---

## Key Features

1. **Beginner Issue Discovery Hub (`/explore`)**:
   - Curates open issues tagged `good first issue`, `help wanted`, `beginner`, and `documentation` across active GitHub repositories.
   - Filter by language (TypeScript, Python, Rust, Go, Java, C++, etc.), difficulty level, and sorting.
   - Filter state is synchronized with URL search params for shareable and refresh-resilient queries.

2. **Personal Contributor Workspace & Kanban (`/workspace`)**:
   - Track issues into four lifecycle stages: **Saved**, **Interested**, **In Progress**, and **Completed**.
   - Attach personal implementation notes to any tracked issue.
   - Synchronized with Prisma SQLite/PostgreSQL storage and resilient `localStorage` caching for zero-setup unauthenticated browsing.

3. **Transparent Relevance Recommendations**:
   - Set programming languages, frameworks, topics, and experience level in the Recommendation Preferences profile.
   - Computes transparent, explainable match percentages (0–100%) with exact breakdown reasons.
   - Zero false pretenses: Heuristic scores are clearly labeled and never disguised as AI certainty.

4. **Personal Contribution Progress & PR Verification**:
   - Lightweight contribution counter and customizable monthly target goals.
   - Attach GitHub Pull Request URLs (`https://github.com/owner/repo/pull/123`) to completed issues.
   - Visually distinguishes manually marked completions from confirmed pull requests.

5. **Repository Health & Staleness Scoring**:
   - Calculates a multi-factor health grade (**A+ through F**) and numerical score (0–100) based on push velocity, issue closure ratios, stale backlog volume (>90 days inactive), and pull request turnover.
   - Computes average and median backlog age in days.

6. **Duplicate Issue Radar**:
   - Deterministic Term Frequency–Inverse Document Frequency (TF-IDF) and weighted token cosine similarity vectorizer.
   - Boosts titles with 3x weight, pairs potential duplicate issues with similarity percentage scores, highlights shared keywords, and provides direct links to inspect issues on GitHub.

7. **AI-Assisted Issue Triage**:
   - Classifies issues into `bug`, `feature`, `documentation`, `question`, `enhancement`, or `performance`.
   - Recommends priority (`critical`, `high`, `medium`, `low`) with transparent reasoning.
   - Identifies missing information (reproduction steps, environment details, logs).
   - Generates suggested labels with one-click copying.
   - **Zero-Crash Degradation**: If no AI key is configured, all repository analysis, duplicate detection, health scoring, and export tools continue working seamlessly.

8. **Export & Persistence**:
   - One-click RFC-4180 compliant CSV issue backlog exports.
   - Comprehensive Markdown intelligence reports formatted for team reviews.
   - Save and manage repository snapshots via Prisma ORM (SQLite for zero-setup local dev/test; PostgreSQL with Docker Compose for production).

9. **Hardened Security**:
   - **SSRF Defense**: Strict regex validation of owner and repository names (`^[a-zA-Z0-9_.-]+$`), restricting outgoing requests solely to `api.github.com`.
   - **Prompt Injection Defense**: Issue titles and descriptions are wrapped in strict `<untrusted_issue_data>` XML fences with explicit system directives preventing prompt hijacking.
   - **Read-Only**: Zero write operations or destructive actions to GitHub repositories.

---

## Architecture Overview

```
                      +-----------------------------+
                      |         Web Client          |
                      | Next.js App Router (React)  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |      Route Handlers         |
                      |  /api/analyze, /api/triage  |
                      |        /api/reports         |
                      +---+----------+----------+---+
                          |          |          |
            +-------------+          |          +------------+
            v                        v                       v
+-----------------------+ +--------------------+ +----------------------+
|     GitHub Client     | | AI Triage Service  | |   Prisma ORM Layer   |
| - SSRF URL Validator  | | - Gemini 1.5 Flash | | - SQLite (Dev/Test)  |
| - Rate-Limit Tracker  | | - OpenAI GPT-4o    | | - PostgreSQL (Prod)  |
| - In-Memory Cache     | | - Schema Validator | | - Saved Analyses     |
| - Issues Normalizer   | | - Injection Guard  | | - Triage Snapshots   |
+-----------------------+ +--------------------+ +----------------------+
            |                        |                       |
            v                        v                       v
  GitHub REST API v3       Google AI / OpenAI API     Database Container
```

For complete architectural details, see [docs/architecture.md](docs/architecture.md).

---

## Quick Start & Installation

### Prerequisites
- Node.js 18.x or 20+ (tested on Node v20/v24)
- npm 9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/issuepilot.git
cd issuepilot
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |
| `GITHUB_TOKEN` | Optional GitHub Personal Access Token (raises rate limit from 60 to 5,000 req/hr) | Empty |
| `AI_PROVIDER` | LLM provider: `gemini` or `openai` | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/)) | Empty |
| `OPENAI_API_KEY` | Optional OpenAI API key alternative | Empty |
| `DATABASE_URL` | Prisma database connection string | `"file:./dev.db"` |

### 3. Initialize Database
Initialize the Prisma SQLite database (no external services needed):
```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Tests

IssuePilot includes comprehensive unit, integration, and E2E pipeline tests with Vitest:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Type Checking
```bash
npx tsc --noEmit
```

### Production Build
```bash
npm run build
npm run start
```

---

## Production Deployment with Docker

To deploy with PostgreSQL and Redis:

```bash
# Start PostgreSQL and Redis containers
docker compose up -d

# Set DATABASE_URL in .env
DATABASE_URL="postgresql://issuepilot:issuepilot_secret@localhost:5432/issuepilot_db?schema=public"

# Deploy database migrations
npx prisma db push

# Build and start
npm run build
npm start
```

---

## License
MIT
