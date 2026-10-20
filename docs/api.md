# IssuePilot API Documentation

All API endpoints are hosted under `/api`.

---

## 1. POST `/api/analyze`
Analyzes a public GitHub repository, computes health metrics, normalizes issues, and returns duplicate candidates.

### Request Body
```json
{
  "repo": "facebook/react",
  "bypassCache": false
}
```

### Response (200 OK)
```json
{
  "repository": {
    "owner": "facebook",
    "repo": "react",
    "fullName": "facebook/react",
    "description": "The library for web and native user interfaces.",
    "stars": 230000,
    "forks": 46000,
    "openIssuesCount": 450,
    "openPrCount": 80,
    "closedPrCount": 12000,
    "language": "JavaScript",
    "license": "MIT",
    "createdAt": "2013-05-24T16:15:54Z",
    "pushedAt": "2026-10-20T12:00:00Z"
  },
  "health": {
    "score": 88,
    "grade": "A",
    "breakdown": {
      "activityScore": 25,
      "issueHealthScore": 20,
      "prVelocityScore": 23,
      "stalenessScore": 20
    },
    "staleIssuesCount": 12,
    "staleIssuesRatio": 0.12,
    "averageIssueAgeDays": 24,
    "medianIssueAgeDays": 18
  },
  "issues": [...],
  "labelsDistribution": [...],
  "activityTimeline": [...],
  "rateLimit": {
    "limit": 5000,
    "remaining": 4980,
    "resetAt": "2026-10-21T01:00:00.000Z",
    "isApproachingLimit": false
  }
}
```

---

## 2. POST `/api/triage`
Categorizes a single issue and suggests priorities, reproduction requirements, and labels.

### Request Body
```json
{
  "issueNumber": 1001,
  "title": "WebSocket client memory leak on reconnect",
  "body": "When reconnecting multiple times under high packet load, memory grows unboundedly.",
  "author": "developer-jane",
  "currentLabels": ["needs-triage"],
  "repoFullName": "owner/repo"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "isConfigured": true,
  "data": {
    "category": "bug",
    "priority": "high",
    "confidence": 0.88,
    "summary": "Memory leak detected during repeated WebSocket client reconnection attempts.",
    "reasoning": "Affects real-time communication resilience in production workloads.",
    "missingInformation": [
      "Exact Node.js or browser engine version",
      "Heap snapshot or minimal reproduction repository"
    ],
    "suggestedLabels": ["bug", "network", "performance"],
    "isAiGenerated": true,
    "modelUsed": "gemini-1.5-flash"
  }
}
```

If AI is not configured, returns `isConfigured: false` with guidance:
```json
{
  "success": false,
  "isConfigured": false,
  "error": "AI provider is not configured. Add GEMINI_API_KEY or OPENAI_API_KEY to enable AI triage."
}
```

---

## 3. GET, POST, DELETE `/api/reports`
Manages saved repository analysis snapshots in the database.

### GET `/api/reports`
Returns list of recent saved analyses.

### GET `/api/reports?id={id}`
Returns a specific saved snapshot including its full JSON data snapshot.

### POST `/api/reports`
Saves an analysis snapshot:
```json
{
  "owner": "facebook",
  "repo": "react",
  "repoName": "facebook/react",
  "description": "React framework",
  "stars": 230000,
  "forks": 46000,
  "openIssues": 450,
  "openPrs": 80,
  "healthScore": 88,
  "primaryLanguage": "JavaScript",
  "dataSnapshot": "{...}"
}
```

### DELETE `/api/reports?id={id}`
Deletes the snapshot with the specified ID.
