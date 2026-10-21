"use client";

import * as React from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Copy,
  Check,
  Cpu,
  Info,
  ExternalLink,
} from "lucide-react";
import { NormalizedIssue } from "@/lib/github/types";
import { TriageResult } from "@/lib/ai/types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface AiTriageModalProps {
  issue: NormalizedIssue | null;
  repoFullName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AiTriageModal({ issue, repoFullName, isOpen, onClose }: AiTriageModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<TriageResult | null>(null);
  const [isConfigured, setIsConfigured] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedLabels, setCopiedLabels] = React.useState(false);

  const performTriage = React.useCallback(async () => {
    if (!issue) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueNumber: issue.number,
          title: issue.title,
          body: issue.body || "",
          author: issue.author.login,
          currentLabels: issue.labels.map((l) => l.name),
          repoFullName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsConfigured(Boolean(data.isConfigured));
        setError(data.error || "Unable to complete AI triage.");
        return;
      }

      setIsConfigured(true);
      setResult(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error contacting triage service.");
    } finally {
      setIsLoading(false);
    }
  }, [issue, repoFullName]);

  React.useEffect(() => {
    if (isOpen && issue) {
      performTriage();
    } else {
      setResult(null);
      setError(null);
    }
  }, [isOpen, issue, performTriage]);

  const handleCopyLabels = () => {
    if (!result?.suggestedLabels) return;
    navigator.clipboard.writeText(result.suggestedLabels.join(", "));
    setCopiedLabels(true);
    setTimeout(() => setCopiedLabels(false), 2000);
  };

  if (!isOpen || !issue) return null;

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
      default:
        return "secondary";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/60 dark:bg-background/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card relative w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 dark:border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 bg-muted/30 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="p-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary backdrop-blur-md shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>AI Issue Triage</span>
                <span className="font-mono text-xs text-muted-foreground">#{issue.number}</span>
              </h3>
              <p className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-sm">
                {issue.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 text-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-foreground">
                Synthesizing issue context & classifying...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Analyzing technical keywords, symptoms, and reproducibility
              </p>
            </div>
          ) : !isConfigured ? (
            /* Unconfigured AI Guidance State */
            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
              <div className="flex items-center gap-2.5 text-foreground font-semibold">
                <Cpu className="h-5 w-5 text-indigo-500" />
                <span>AI Provider Not Configured</span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                IssuePilot provides intelligent issue categorization, priority assignment, reproduction
                gap detection, and label recommendations when an AI provider is configured.
              </p>

              <div className="rounded-lg border border-border bg-background p-3.5 space-y-2">
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                  Quick Setup Instructions
                </span>
                <p className="text-xs text-muted-foreground">
                  Add a free Google Gemini key or OpenAI key to your project’s <code>.env</code> file:
                </p>
                <pre className="p-2.5 rounded bg-muted text-[11px] font-mono text-foreground overflow-x-auto">
                  <code>GEMINI_API_KEY=your_gemini_api_key_here</code>
                </pre>
                <div className="pt-1 flex items-center gap-2">
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    <span>Get free Google Gemini API Key</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground italic">
                * Note: All repository metrics, duplicate issue detection, backlog filtering, and
                report exports remain 100% operational without AI.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Triage Request Failed</span>
              </div>
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={performTriage}
                className="text-xs mt-2 h-7"
              >
                Retry Triage
              </Button>
            </div>
          ) : result ? (
            /* Triage Result Display */
            <div className="space-y-4">
              {/* Category & Priority Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Classification:</span>
                  <Badge variant="indigo" className="uppercase font-mono text-xs">
                    {result.category}
                  </Badge>
                  <Badge variant={getPriorityVariant(result.priority)} className="uppercase font-mono text-xs">
                    {result.priority} priority
                  </Badge>
                </div>

                <div className="text-xs font-mono text-muted-foreground">
                  Confidence: <span className="font-semibold text-foreground">{Math.round(result.confidence * 100)}%</span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Executive Summary
                </span>
                <p className="text-xs sm:text-sm text-foreground bg-card p-3 rounded-lg border border-border leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* Reasoning */}
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Triage Reasoning
                </span>
                <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/80 leading-relaxed">
                  {result.reasoning}
                </p>
              </div>

              {/* Missing Information Checklist */}
              {result.missingInformation && result.missingInformation.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-amber-500" />
                    <span>Missing Information / Follow-up Needed</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-foreground bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg">
                    {result.missingInformation.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Labels */}
              {result.suggestedLabels && result.suggestedLabels.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span>Suggested Labels</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleCopyLabels}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                    >
                      {copiedLabels ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Labels</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {result.suggestedLabels.map((lbl, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs font-mono">
                        {lbl}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 sm:px-6 py-3 bg-muted/20 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground truncate">
            {result?.modelUsed ? `Model: ${result.modelUsed}` : "IssuePilot AI Assistant"}
          </span>

          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8 px-4 shrink-0">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
