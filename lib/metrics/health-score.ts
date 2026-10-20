import { NormalizedIssue, RepositorySummary } from "../github/types";

export interface HealthCalculationResult {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  breakdown: {
    activityScore: number;
    issueHealthScore: number;
    prVelocityScore: number;
    stalenessScore: number;
  };
  staleIssuesCount: number;
  staleIssuesRatio: number;
  averageIssueAgeDays: number;
  medianIssueAgeDays: number;
}

const STALE_DAYS_THRESHOLD = 90;

export function calculateRepositoryHealth(
  repo: RepositorySummary,
  issues: NormalizedIssue[]
): HealthCalculationResult {
  const now = new Date();

  // 1. Activity Score (0 - 25)
  let activityScore = 5;
  if (repo.pushedAt) {
    const lastPushedDate = new Date(repo.pushedAt);
    const diffDays = Math.max(
      0,
      Math.floor((now.getTime() - lastPushedDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (diffDays <= 7) activityScore = 25;
    else if (diffDays <= 30) activityScore = 20;
    else if (diffDays <= 90) activityScore = 15;
    else if (diffDays <= 180) activityScore = 10;
    else activityScore = 4;
  }

  // 2. Staleness Score (0 - 25)
  const openIssues = issues.filter((i) => i.state === "open" && !i.isPullRequest);
  let staleCount = 0;
  const ages: number[] = [];

  for (const issue of openIssues) {
    const age = issue.ageInDays;
    ages.push(age);
    if (age > STALE_DAYS_THRESHOLD) {
      staleCount++;
    }
  }

  const staleRatio = openIssues.length > 0 ? staleCount / openIssues.length : 0;
  let stalenessScore = 25;
  if (staleRatio > 0.7) stalenessScore = 5;
  else if (staleRatio > 0.5) stalenessScore = 10;
  else if (staleRatio > 0.3) stalenessScore = 15;
  else if (staleRatio > 0.15) stalenessScore = 20;
  else stalenessScore = 25;

  // 3. Issue Health & Closure Score (0 - 25)
  const totalIssuesInSample = issues.filter((i) => !i.isPullRequest);
  const closedCount = totalIssuesInSample.filter((i) => i.state === "closed").length;
  const closedRatio = totalIssuesInSample.length > 0 ? closedCount / totalIssuesInSample.length : 0.5;

  let issueHealthScore = 15;
  if (closedRatio >= 0.6) issueHealthScore = 25;
  else if (closedRatio >= 0.4) issueHealthScore = 20;
  else if (closedRatio >= 0.2) issueHealthScore = 15;
  else issueHealthScore = 10;

  // 4. PR Velocity Score (0 - 25)
  const totalPrs = repo.openPrCount + repo.closedPrCount;
  let prVelocityScore = 18;
  if (totalPrs > 0) {
    const closedPrRatio = repo.closedPrCount / totalPrs;
    if (closedPrRatio >= 0.75) prVelocityScore = 25;
    else if (closedPrRatio >= 0.5) prVelocityScore = 20;
    else if (closedPrRatio >= 0.3) prVelocityScore = 15;
    else prVelocityScore = 10;
  }

  // Aggregate
  const totalScore = Math.min(
    100,
    Math.max(0, activityScore + stalenessScore + issueHealthScore + prVelocityScore)
  );

  let grade: "A+" | "A" | "B" | "C" | "D" | "F" = "F";
  if (totalScore >= 90) grade = "A+";
  else if (totalScore >= 80) grade = "A";
  else if (totalScore >= 70) grade = "B";
  else if (totalScore >= 60) grade = "C";
  else if (totalScore >= 50) grade = "D";
  else grade = "F";

  // Calculate Average & Median Age
  let avgAge = 0;
  let medianAge = 0;
  if (ages.length > 0) {
    avgAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
    const sorted = [...ages].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianAge = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  return {
    score: totalScore,
    grade,
    breakdown: {
      activityScore,
      issueHealthScore,
      prVelocityScore,
      stalenessScore,
    },
    staleIssuesCount: staleCount,
    staleIssuesRatio: Math.round(staleRatio * 100) / 100,
    averageIssueAgeDays: avgAge,
    medianIssueAgeDays: medianAge,
  };
}
