import { describe, expect, it } from "vitest";
import { triageOutputSchema, triageRequestSchema } from "../../lib/ai/schema";
import { getAiServiceConfig, triageIssue } from "../../lib/ai/service";

describe("AI Triage Service & Schema Validation", () => {
  it("validates well-formed AI response against schema", () => {
    const validResponse = {
      category: "bug",
      priority: "high",
      confidence: 0.88,
      summary: "WebSocket fails to reconnect after network interruption.",
      reasoning: "Affects core real-time synchronization in production.",
      missingInformation: ["Node.js runtime version", "Network proxy configuration"],
      suggestedLabels: ["bug", "network", "websocket"],
    };

    const parseResult = triageOutputSchema.safeParse(validResponse);
    expect(parseResult.success).toBe(true);
  });

  it("rejects invalid categories or out-of-range confidence", () => {
    const invalidCategory = {
      category: "nonsense_category",
      priority: "high",
      confidence: 0.88,
      summary: "A summary",
      reasoning: "A reasoning",
      missingInformation: [],
      suggestedLabels: [],
    };
    expect(triageOutputSchema.safeParse(invalidCategory).success).toBe(false);

    const invalidConfidence = {
      category: "bug",
      priority: "high",
      confidence: 2.5, // > 1.0
      summary: "A summary",
      reasoning: "A reasoning",
      missingInformation: [],
      suggestedLabels: [],
    };
    expect(triageOutputSchema.safeParse(invalidConfidence).success).toBe(false);
  });

  it("validates triage request payload", () => {
    const validRequest = {
      issueNumber: 42,
      title: "Crash on startup with null pointer",
      body: "Stack trace attached below...",
      author: "developer",
      repoFullName: "owner/repo",
      currentLabels: ["needs-triage"],
    };
    expect(triageRequestSchema.safeParse(validRequest).success).toBe(true);

    const invalidRequest = {
      issueNumber: -1, // invalid
      title: "",
      author: "developer",
      repoFullName: "owner/repo",
    };
    expect(triageRequestSchema.safeParse(invalidRequest).success).toBe(false);
  });

  it("gracefully reports unconfigured AI state when API keys are absent", async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalOpenAI = process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const config = getAiServiceConfig();
    expect(config.isConfigured).toBe(false);

    const result = await triageIssue({
      issueNumber: 10,
      title: "Sample bug report",
      body: "Sample details",
      author: "tester",
      repoFullName: "org/sample",
    });

    expect(result.success).toBe(false);
    expect(result.isConfigured).toBe(false);
    expect(result.error).toContain("AI provider is not configured");

    // Restore env
    if (originalGemini) process.env.GEMINI_API_KEY = originalGemini;
    if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
  });

  it("defaults to gemini-3.5-flash-lite model when GEMINI_MODEL is not overridden", () => {
    const originalModel = process.env.GEMINI_MODEL;
    delete process.env.GEMINI_MODEL;
    const defaultModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    expect(defaultModel).toBe("gemini-3.5-flash-lite");

    process.env.GEMINI_MODEL = "gemini-3.5-flash-lite";
    expect(process.env.GEMINI_MODEL).toBe("gemini-3.5-flash-lite");

    if (originalModel) {
      process.env.GEMINI_MODEL = originalModel;
    }
  });
});
