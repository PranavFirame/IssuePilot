export type IssueCategory = "bug" | "feature" | "documentation" | "question" | "enhancement" | "performance";

export type IssuePriority = "critical" | "high" | "medium" | "low";

export interface TriageResult {
  category: IssueCategory;
  priority: IssuePriority;
  confidence: number; // 0.0 to 1.0
  summary: string;
  reasoning: string;
  missingInformation: string[];
  suggestedLabels: string[];
  isAiGenerated: boolean;
  modelUsed?: string;
}

export interface TriageRequestPayload {
  issueNumber: number;
  title: string;
  body?: string | null;
  author: string;
  currentLabels?: string[];
  repoFullName: string;
}

export interface AiServiceConfig {
  provider: "gemini" | "openai" | "none";
  apiKey?: string;
  isConfigured: boolean;
}
