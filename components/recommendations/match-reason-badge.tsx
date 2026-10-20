"use client";

import * as React from "react";
import { Sparkles, Info, X } from "lucide-react";
import { RecommendationMatch } from "@/lib/recommendations/matcher";

interface MatchReasonBadgeProps {
  match: RecommendationMatch;
  className?: string;
}

export function MatchReasonBadge({ match, className }: MatchReasonBadgeProps) {
  const [showPopover, setShowPopover] = React.useState(false);

  if (match.score < 40) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold transition-all border ${
          match.score >= 80
            ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
            : match.score >= 60
            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
        } ${className || ""}`}
      >
        <Sparkles className="h-3 w-3" />
        <span>{match.score}% Match</span>
      </button>

      {/* Popover Breakdown */}
      {showPopover && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-72 rounded-lg border border-border bg-card p-3 shadow-xl text-xs space-y-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Relevance Score ({match.score}%)</span>
            </span>
            <button
              onClick={() => setShowPopover(false)}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
              Match Reasons:
            </span>
            <ul className="space-y-1 text-foreground">
              {match.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[10px] text-muted-foreground/80 italic pt-1 border-t border-border/60">
            * Heuristic score calculated from your preferred languages and experience profile. Not an
            AI-generated certainty.
          </p>
        </div>
      )}
    </div>
  );
}
