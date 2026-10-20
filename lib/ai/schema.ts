import { z } from "zod";

export const triageOutputSchema = z.object({
  category: z.enum([
    "bug",
    "feature",
    "documentation",
    "question",
    "enhancement",
    "performance",
  ]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1).max(500),
  reasoning: z.string().min(1).max(1000),
  missingInformation: z.array(z.string()).default([]),
  suggestedLabels: z.array(z.string()).default([]),
});

export type ValidatedTriageOutput = z.infer<typeof triageOutputSchema>;

export const triageRequestSchema = z.object({
  issueNumber: z.number().int().positive(),
  title: z.string().min(1).max(1000),
  body: z.string().nullable().optional(),
  author: z.string().min(1).max(100),
  currentLabels: z.array(z.string()).optional(),
  repoFullName: z.string().min(1).max(200),
});
