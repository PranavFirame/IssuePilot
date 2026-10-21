"use client";

import * as React from "react";
import { CopyCheck, ExternalLink, SlidersHorizontal, Sparkles, AlertCircle } from "lucide-react";
import { NormalizedIssue } from "@/lib/github/types";
import { DuplicateCandidate, findPotentialDuplicates } from "@/lib/triage/duplicates";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

interface DuplicateDetectorProps {
  issues: NormalizedIssue[];
}

export function DuplicateDetector({ issues }: DuplicateDetectorProps) {
  const [threshold, setThreshold] = React.useState<number>(0.38);

  const candidates: DuplicateCandidate[] = React.useMemo(() => {
    return findPotentialDuplicates(issues, threshold, 30);
  }, [issues, threshold]);

  return (
    <div className="space-y-5">
      {/* Control bar */}
      <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-500 backdrop-blur-md">
            <CopyCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Duplicate Issue Radar</h3>
            <p className="text-xs text-muted-foreground">
              TF-IDF token similarity vectorization across titles and backlog descriptions.
            </p>
          </div>
        </div>

        {/* Sensitivity selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Sensitivity:
          </span>
          <div className="inline-flex rounded-xl border border-border/70 dark:border-white/10 p-1 bg-muted/40 dark:bg-white/5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setThreshold(0.5)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                threshold >= 0.5 ? "bg-background dark:bg-card text-foreground font-semibold shadow-sm border border-border/60 dark:border-white/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Strict (50%+)
            </button>
            <button
              type="button"
              onClick={() => setThreshold(0.38)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                threshold === 0.38 ? "bg-background dark:bg-card text-foreground font-semibold shadow-sm border border-border/60 dark:border-white/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Balanced (38%+)
            </button>
            <button
              type="button"
              onClick={() => setThreshold(0.28)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                threshold <= 0.28 ? "bg-background dark:bg-card text-foreground font-semibold shadow-sm border border-border/60 dark:border-white/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Broad (28%+)
            </button>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      {candidates.length === 0 ? (
        <div className="glass-card p-10 sm:p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 backdrop-blur-md shadow-sm">
            <CopyCheck className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-foreground mb-1">
            No high-confidence duplicate pairs detected
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            No two issues in the current sample met the {Math.round(threshold * 100)}% similarity
            threshold. Try setting sensitivity to <strong>Broad</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Found {candidates.length} potential duplicate candidates</span>
            <span>Sorted by highest cosine similarity</span>
          </div>

          {candidates.map((pair, idx) => (
            <div
              key={idx}
              className="glass-card-interactive p-4 sm:p-5 space-y-3.5"
            >
              {/* Header Match % and Explanation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={pair.similarityScore >= 60 ? "destructive" : "warning"}
                    className="font-mono text-xs px-2"
                  >
                    {pair.similarityScore}% Match
                  </Badge>
                  <p className="text-xs text-muted-foreground">{pair.explanation}</p>
                </div>

                {pair.sharedTerms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-mono">Shared:</span>
                    {pair.sharedTerms.map((term, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-[10px]"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pair Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                {/* Primary Issue */}
                <div className="p-3.5 rounded-xl border border-border/70 dark:border-white/10 bg-background/50 dark:bg-card/40 backdrop-blur-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-primary font-semibold">
                      #{pair.primaryIssue.number}
                    </span>
                    <Badge
                      variant={pair.primaryIssue.state === "open" ? "success" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {pair.primaryIssue.state}
                    </Badge>
                  </div>
                  <p className="font-medium text-foreground text-xs leading-snug line-clamp-2">
                    {pair.primaryIssue.title}
                  </p>
                  <a
                    href={pair.primaryIssue.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium pt-1"
                  >
                    <span>Inspect on GitHub</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Similar Issue */}
                <div className="p-3.5 rounded-xl border border-border/70 dark:border-white/10 bg-background/50 dark:bg-card/40 backdrop-blur-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-primary font-semibold">
                      #{pair.similarIssue.number}
                    </span>
                    <Badge
                      variant={pair.similarIssue.state === "open" ? "success" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {pair.similarIssue.state}
                    </Badge>
                  </div>
                  <p className="font-medium text-foreground text-xs leading-snug line-clamp-2">
                    {pair.similarIssue.title}
                  </p>
                  <a
                    href={pair.similarIssue.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium pt-1"
                  >
                    <span>Inspect on GitHub</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
