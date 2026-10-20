import { NormalizedIssue, RepositoryAnalysisPayload } from "../github/types";

function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates RFC 4180 compliant CSV of issues.
 */
export function generateIssuesCsv(issues: NormalizedIssue[], repoFullName: string): string {
  const headers = [
    "Repository",
    "Issue Number",
    "Title",
    "State",
    "Author",
    "Comments Count",
    "Labels",
    "Age (Days)",
    "Is Stale (>90d)",
    "Created At",
    "Updated At",
    "GitHub URL",
  ];

  const rows = issues.map((issue) => {
    const labelsStr = issue.labels.map((l) => l.name).join("; ");
    return [
      escapeCsvField(repoFullName),
      escapeCsvField(issue.number),
      escapeCsvField(issue.title),
      escapeCsvField(issue.state),
      escapeCsvField(issue.author.login),
      escapeCsvField(issue.commentsCount),
      escapeCsvField(labelsStr),
      escapeCsvField(issue.ageInDays),
      escapeCsvField(issue.isStale ? "Yes" : "No"),
      escapeCsvField(issue.createdAt),
      escapeCsvField(issue.updatedAt),
      escapeCsvField(issue.htmlUrl),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

/**
 * Generates comprehensive Markdown summary report.
 */
export function generateRepositoryMarkdownReport(data: RepositoryAnalysisPayload): string {
  const { repository, health, labelsDistribution, issues } = data;
  const now = new Date().toISOString();

  const openIssues = issues.filter((i) => i.state === "open" && !i.isPullRequest);
  const staleIssues = openIssues.filter((i) => i.isStale);

  return `# IssuePilot Intelligence Report: ${repository.fullName}

> Generated on **${now}** via IssuePilot

---

## 1. Executive Summary

- **Repository**: [${repository.fullName}](${repository.htmlUrl})
- **Description**: ${repository.description || "No description provided."}
- **Primary Language**: ${repository.language || "Not detected"}
- **License**: ${repository.license || "None / Not specified"}
- **Stars**: ${repository.stars.toLocaleString()} | **Forks**: ${repository.forks.toLocaleString()}
- **Default Branch**: \`${repository.defaultBranch}\`
- **Archived**: ${repository.isArchived ? "⚠️ Yes (Read-Only)" : "No"}

---

## 2. Health & Maintenance Scorecard

| Metric | Evaluation | Grade / Ratio |
|---|---|---|
| **Overall Health Score** | **${health.score}/100** | **Grade ${health.grade}** |
| **Activity Velocity** | ${health.breakdown.activityScore}/25 | Recent Push: ${new Date(repository.pushedAt).toLocaleDateString()} |
| **Backlog Staleness** | ${health.breakdown.stalenessScore}/25 | ${health.staleIssuesCount} stale / ${openIssues.length} open (${Math.round(health.staleIssuesRatio * 100)}%) |
| **Issue Resolution Ratio** | ${health.breakdown.issueHealthScore}/25 | Sample Resolution Rate |
| **Pull Request Velocity** | ${health.breakdown.prVelocityScore}/25 | ${repository.openPrCount} open / ${repository.closedPrCount} closed |

### Backlog Age Metrics
- **Average Open Issue Age**: ${health.averageIssueAgeDays} days
- **Median Open Issue Age**: ${health.medianIssueAgeDays} days

---

## 3. Label Distribution (Top Categories)

${
  labelsDistribution.length > 0
    ? `| Label Name | Associated Issues | Color |
|---|---|---|
${labelsDistribution
  .slice(0, 10)
  .map((l) => `| \`${l.name}\` | ${l.count} | #${l.color} |`)
  .join("\n")}`
    : "_No labels defined or applied in sampled issues._"
}

---

## 4. Stale Issues Attention List (>90 Days Inactive)

${
  staleIssues.length > 0
    ? staleIssues
        .slice(0, 10)
        .map(
          (issue) =>
            `- **#${issue.number}**: [${issue.title}](${issue.htmlUrl}) (${issue.ageInDays} days old, ${issue.commentsCount} comments)`
        )
        .join("\n")
    : "_No stale issues detected in the active backlog! Excellent maintenance velocity._"
}

---

## 5. Maintenance Recommendations

1. **Stale Backlog Triage**: ${
    health.staleIssuesRatio > 0.3
      ? "Over 30% of open issues are older than 90 days. Schedule a triage session or implement automated stale issue reminders."
      : "Stale backlog is well managed. Continue regular review cycles."
  }
2. **Pull Request Review**: ${
    repository.openPrCount > 50
      ? "Elevated open PR count. Prioritize community contributions to maintain contributor engagement."
      : "PR queue is currently at a healthy volume."
  }
3. **Issue Labeling**: ${
    labelsDistribution.length < 5
      ? "Repository could benefit from additional descriptive triage labels (e.g. `bug`, `enhancement`, `good first issue`)."
      : "Healthy taxonomy of labels in active use."
  }

---
*Report exported with [IssuePilot](https://github.com/)*
`;
}
