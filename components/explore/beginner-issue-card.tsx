"use client";

import * as React from "react";
import Image from "next/image";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Star,
  Tag,
  ChevronDown,
} from "lucide-react";
import { BeginnerIssue } from "@/lib/github/search";
import { DifficultyBadge } from "./difficulty-badge";
import { FreshnessIndicator } from "../dashboard/freshness-indicator";
import { MatchReasonBadge } from "../recommendations/match-reason-badge";
import { RecommendationMatch } from "@/lib/recommendations/matcher";
import { IssueBreakdown } from "./issue-breakdown";
import { Button } from "../ui/button";
import { formatDate, formatNumber } from "@/lib/utils";

interface BeginnerIssueCardProps {
  issue: BeginnerIssue;
  match?: RecommendationMatch;
  isSaved?: boolean;
  currentStatus?: "saved" | "interested" | "in_progress" | "completed";
  onTrackIssue: (
    issue: BeginnerIssue,
    status: "saved" | "interested" | "in_progress" | "completed"
  ) => void;
  onTriageIssue: (issue: BeginnerIssue) => void;
}

export function BeginnerIssueCard({
  issue,
  match,
  isSaved,
  currentStatus,
  onTrackIssue,
  onTriageIssue,
}: BeginnerIssueCardProps) {
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);
  const [showBreakdown, setShowBreakdown] = React.useState(false);

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "interested":
        return "Interested";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "saved":
      default:
        return "Saved";
    }
  };

  return (
    <div className="glass-card-interactive p-4 sm:p-5 space-y-3.5">
      {/* Top Header: Repo, Difficulty, Freshness */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-6 w-6 rounded-md overflow-hidden bg-muted border border-border shrink-0">
            <Image
              src={issue.repository.avatarUrl}
              alt={issue.repository.owner}
              width={24}
              height={24}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>

          <a
            href={issue.repository.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-semibold text-foreground hover:text-primary transition-colors truncate max-w-[140px] sm:max-w-none"
          >
            {issue.repository.fullName}
          </a>

          {issue.repository.stars !== undefined && (
            <span className="flex items-center gap-0.5 text-[11px] font-mono text-muted-foreground">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              {formatNumber(issue.repository.stars)}
            </span>
          )}

          {issue.repository.language && (
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground">
              {issue.repository.language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {match && <MatchReasonBadge match={match} />}
          <DifficultyBadge difficulty={issue.difficulty} />
          <FreshnessIndicator freshness={issue.freshness} />
        </div>
      </div>

      {/* Title & Issue Number */}
      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-muted-foreground shrink-0">
            #{issue.number}
          </span>
          <a
            href={issue.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors leading-snug line-clamp-2"
          >
            {issue.title}
          </a>
        </div>

        {issue.body && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
            {issue.body.replace(/[#*`_]/g, "")}
          </p>
        )}
      </div>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {issue.labels.slice(0, 5).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono border"
              style={{
                backgroundColor: `#${label.color}15`,
                borderColor: `#${label.color}40`,
                color: `#${label.color}`,
              }}
            >
              {label.name}
            </span>
          ))}
          {issue.labels.length > 5 && (
            <span className="text-[10px] text-muted-foreground font-mono">
              +{issue.labels.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Expandable Issue Breakdown */}
      {showBreakdown && (
        <IssueBreakdown
          title={issue.title}
          body={issue.body}
          labels={issue.labels.map((l) => l.name)}
          language={issue.repository.language}
          owner={issue.repository.owner}
          repo={issue.repository.name}
          htmlUrl={issue.htmlUrl}
        />
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
          <span>Opened {formatDate(issue.createdAt)}</span>
          <span className="flex items-center gap-1 font-mono">
            <MessageSquare className="h-3 w-3" />
            {issue.commentsCount}
          </span>
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
          >
            <Sparkles className="h-3 w-3" />
            <span>{showBreakdown ? "Hide Breakdown" : "Skills & Breakdown"}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Tracking Dropdown */}
          <div className="relative">
            <Button
              variant={isSaved ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="h-8 sm:h-7 text-xs gap-1.5"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                  <span>{getStatusLabel(currentStatus)}</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Track Issue</span>
                </>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>

            {showStatusMenu && (
              <div className="absolute left-0 sm:left-auto sm:right-0 bottom-full mb-1.5 z-30 w-36 rounded-xl border border-border bg-white p-1 shadow-2xl text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                {(["saved", "interested", "in_progress", "completed"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      onTrackIssue(issue, st);
                      setShowStatusMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                      currentStatus === st
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>{getStatusLabel(st)}</span>
                    {currentStatus === st && <CheckCircle2 className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* AI Triage Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTriageIssue(issue)}
              className="h-8 sm:h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3 w-3" />
              <span>AI Triage</span>
            </Button>

            {/* GitHub Direct Link */}
            <a
              href={issue.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 sm:h-7 px-2.5 rounded-md border border-border text-foreground hover:bg-muted transition-colors"
              title="Inspect on GitHub"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
