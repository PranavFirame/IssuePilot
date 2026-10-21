"use client";

import * as React from "react";
import {
  Sparkles,
  BookOpen,
  Code2,
  ExternalLink,
  GitBranch,
  Terminal,
  Info,
} from "lucide-react";

interface IssueBreakdownProps {
  title: string;
  body?: string | null;
  labels: string[];
  language?: string | null;
  owner: string;
  repo: string;
  htmlUrl: string;
}

export function IssueBreakdown({
  title,
  body,
  labels,
  language,
  owner,
  repo,
  htmlUrl,
}: IssueBreakdownProps) {
  const combinedText = `${title} ${body || ""} ${labels.join(" ")}`.toLowerCase();

  // 1. Derive likely skills involved
  const skills = React.useMemo(() => {
    const list: string[] = [];

    if (language) {
      list.push(language);
    }

    if (/react|jsx|tsx|hook|component/i.test(combinedText)) {
      list.push("React Components");
    }
    if (/typescript|type|interface|generics/i.test(combinedText)) {
      list.push("TypeScript Types");
    }
    if (/test|vitest|jest|spec|coverage/i.test(combinedText)) {
      list.push("Unit Testing");
    }
    if (/doc|readme|guide|markdown|typo|comment/i.test(combinedText)) {
      list.push("Documentation");
    }
    if (/css|tailwind|style|flexbox|grid|ui/i.test(combinedText)) {
      list.push("UI / CSS Styling");
    }
    if (/api|fetch|endpoint|rest|http|async/i.test(combinedText)) {
      list.push("API / Async Logic");
    }
    if (/cli|command|flag|terminal|script/i.test(combinedText)) {
      list.push("CLI / Tooling");
    }

    // Deduplicate
    return Array.from(new Set(list)).slice(0, 5);
  }, [language, combinedText]);

  // 2. Plain-language objective summary
  const summary = React.useMemo(() => {
    const lowerLabels = labels.map((l) => l.toLowerCase());
    if (lowerLabels.some((l) => l.includes("good first") || l.includes("beginner"))) {
      return "Beginner-friendly starter task with isolated scope. Maintainers marked this for first-time contributors.";
    }
    if (lowerLabels.some((l) => l.includes("documentation") || l.includes("docs"))) {
      return "Documentation revision or tutorial clarification. Excellent starting contribution requiring zero core code changes.";
    }
    if (lowerLabels.some((l) => l.includes("bug") || l.includes("fix"))) {
      return "Bug fix: reproducing reported unexpected behavior, addressing root cause, and verifying fix.";
    }
    return "Open contribution ticket: feature enhancement, refactoring, or maintainer requested improvement.";
  }, [labels]);

  const contributingUrl = `https://github.com/${owner}/${repo}/blob/HEAD/CONTRIBUTING.md`;

  return (
    <div className="rounded-xl border border-border/80 bg-accent/20 p-3.5 space-y-3 text-xs animate-in fade-in zoom-in-95">
      {/* Objective Summary */}
      <div className="space-y-1">
        <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
          <Info className="h-3.5 w-3.5 text-primary" />
          <span>Issue Breakdown &amp; Plain-Language Goal</span>
        </p>
        <p className="text-muted-foreground leading-relaxed text-[11px] pl-5">{summary}</p>
      </div>

      {/* Likely Skills Involved */}
      {skills.length > 0 && (
        <div className="space-y-1.5 pl-5">
          <p className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
            <Code2 className="h-3 w-3 text-cyan-400" />
            <span>Likely Relevant Skills:</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-md border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 font-mono text-[10px]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Setup & Contribution Links */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-border/60 text-[11px] pl-5">
        <a
          href={contributingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
        >
          <BookOpen className="h-3 w-3" />
          <span>View CONTRIBUTING.md</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </a>

        <a
          href={htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
        >
          <GitBranch className="h-3 w-3" />
          <span>Inspect Issue #{htmlUrl.split("/").pop()}</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </a>

        <span className="text-[10px] text-muted-foreground/60 italic ml-auto">
          Heuristic skill matching • Not AI certainty
        </span>
      </div>
    </div>
  );
}
