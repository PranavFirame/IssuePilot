# IssuePilot Architecture & System Design

IssuePilot is an AI-powered GitHub issue triage and repository intelligence platform engineered for open-source maintainers, engineering leads, and developer teams.

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

---

## 1. Domain Components & Data Flow

### 1.1 Ingestion & URL Validation
- **Module**: `lib/github/url-parser.ts`
- **SSRF Defense**: Enforces strict repository identifier patterns (`^[a-zA-Z0-9_.-]+$`). Only permits domains resolving to `github.com` or `www.github.com`. Rejects arbitrary URLs, path traversal segments (`..`), and non-GitHub origins.
- **Normalization**: Handles shorthand `owner/repo`, full HTTPS URLs, trailing `.git` extensions, and trailing slashes.

### 1.2 GitHub API Client & Resilience
- **Module**: `lib/github/client.ts`
- **Rate Limit Tracking**: Monitors `x-ratelimit-remaining`, `x-ratelimit-limit`, and `x-ratelimit-reset` response headers.
- **Quota Exceeded Handling**: Returns normalized 403 errors with exact reset timestamps and clear token configuration guidance.
- **Parallel Dispatch**: Executes `Promise.all` across repository metadata, open issues, closed issues sample, closed PRs, and top contributors to eliminate request waterfalls.
- **In-Memory Caching**: Implements a short-lived TTL cache (2 minutes) to prevent redundant upstream GitHub queries.

### 1.3 Repository Health Computation
- **Module**: `lib/metrics/health-score.ts`
- Computes an aggregate health score (0–100) and letter grade (A+ to F) evaluating:
  1. **Push Velocity (0–25 pts)**: Days elapsed since last commit to default branch.
  2. **Backlog Staleness (0–25 pts)**: Proportion of open issues inactive for over 90 days.
  3. **Issue Resolution Ratio (0–25 pts)**: Ratio of closed vs open issues in repository sample.
  4. **Pull Request Turnover (0–25 pts)**: Closed/merged PR velocity against open backlog.

### 1.4 Duplicate Issue Radar (NLP Vectorization)
- **Module**: `lib/triage/duplicates.ts`
- **Tokenization**: Strips markdown formatting, code blocks, URLs, and English stop words.
- **TF-IDF Vectorization**: Computes Term Frequency–Inverse Document Frequency across all sampled issues. Titles are boosted with 3x weight over body text.
- **Cosine Similarity**: Pairs issues with similarity >= 0.38, highlighting shared technical terms and generating clear explanations.

### 1.5 AI-Assisted Issue Triage
- **Module**: `lib/ai/service.ts`, `lib/ai/schema.ts`
- **Supported Providers**: Google Gemini (`gemini-1.5-flash`) via structured JSON schema; OpenAI (`gpt-4o-mini`) fallback.
- **Prompt Injection Defense**: Untrusted issue title and body are contained in strict `<untrusted_issue_data>` XML fences. System instructions enforce passive data treatment and forbid prompt hijacking.
- **Zero-Crash Graceful Degradation**: When no API key is configured, the rest of the application (health scoring, duplicate radar, issue explorer, CSV/Markdown export) remains 100% operational.

### 1.6 Persistence & Storage
- **Module**: `lib/db/prisma.ts`, `prisma/schema.prisma`
- **Prisma Models**:
  - `SavedAnalysis`: Stores snapshot metadata, health scores, and JSON payload.
  - `TriageSnapshot`: Stores individual issue AI recommendations.
  - `AuditLog`: Logs administrative or export actions.
- **Default Database**: Zero-setup SQLite (`file:./dev.db`) for immediate local execution and automated testing; PostgreSQL configuration provided for containerized and production deployments.
