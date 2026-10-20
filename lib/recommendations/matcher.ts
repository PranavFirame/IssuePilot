import { BeginnerIssue } from "../github/search";

export interface UserPreferencesData {
  languages: string[];
  experienceLevel: "beginner" | "intermediate" | "advanced";
  topics: string[];
  monthlyGoal?: number;
}

export interface RecommendationMatch {
  score: number; // 0 to 100
  reasons: string[];
  isHeuristic: boolean;
}

export function calculateRecommendationScore(
  issue: BeginnerIssue,
  prefs: UserPreferencesData
): RecommendationMatch {
  let score = 0;
  const reasons: string[] = [];

  const userLangs = (prefs.languages || []).map((l) => l.toLowerCase().trim());
  const userTopics = (prefs.topics || []).map((t) => t.toLowerCase().trim());
  const issueLang = issue.repository.language?.toLowerCase() || "";
  const issueText = `${issue.title} ${issue.repository.fullName} ${issue.labels
    .map((l) => l.name)
    .join(" ")}`.toLowerCase();

  // 1. Language Match (+35 max)
  const matchesLanguage = userLangs.some((lang) => {
    if (lang === issueLang) return true;
    const wordRegex = new RegExp(`\\b${lang}\\b`, "i");
    return (
      wordRegex.test(issue.title) ||
      issue.labels.some((l) => wordRegex.test(l.name))
    );
  });

  if (matchesLanguage) {
    score += 35;
    reasons.push(
      issue.repository.language
        ? `Matches preferred language: ${issue.repository.language}`
        : "Matches language interests"
    );
  }

  // 2. Experience Level & Difficulty (+30 max)
  if (prefs.experienceLevel === "beginner") {
    if (issue.difficulty === "good first issue") {
      score += 30;
      reasons.push("Marked as 'good first issue' (ideal for beginners)");
    } else if (issue.difficulty === "beginner") {
      score += 28;
      reasons.push("Tagged for beginner contributors");
    } else if (issue.difficulty === "documentation") {
      score += 25;
      reasons.push("Documentation task (great starting point)");
    } else if (issue.difficulty === "help wanted") {
      score += 20;
      reasons.push("Community help requested");
    } else {
      score += 10;
    }
  } else if (prefs.experienceLevel === "intermediate") {
    if (issue.difficulty === "help wanted") {
      score += 30;
      reasons.push("Tagged 'help wanted' for core improvements");
    } else if (issue.difficulty === "good first issue") {
      score += 20;
      reasons.push("Good first issue candidate");
    } else {
      score += 15;
    }
  } else {
    // Advanced
    score += 20;
    reasons.push("Open community backlog item");
  }

  // 3. Topic & Domain Alignment (+20 max)
  const matchedTopics: string[] = [];
  for (const topic of userTopics) {
    if (!topic || topic.length < 2) continue;
    const topicRegex = new RegExp(`\\b${topic}\\b`, "i");
    if (topicRegex.test(issueText)) {
      matchedTopics.push(topic);
    }
  }

  if (matchedTopics.length > 0) {
    const points = Math.min(20, matchedTopics.length * 10);
    score += points;
    reasons.push(`Aligned with topics: [${matchedTopics.join(", ")}]`);
  }

  // 4. Freshness & Repository Vitality (+15 max)
  if (issue.freshness === "recent") {
    score += 10;
    reasons.push("Active thread updated within last 30 days");
  } else if (issue.freshness === "moderate") {
    score += 5;
  }

  if (issue.commentsCount <= 3) {
    score += 5;
    reasons.push("Low competition (few existing comments)");
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    reasons,
    isHeuristic: true,
  };
}
