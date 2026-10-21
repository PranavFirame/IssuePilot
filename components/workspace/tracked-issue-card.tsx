"use client";

import * as React from "react";
import {
  ExternalLink,
  FileText,
  GitPullRequest,
  Trash2,
  CheckCircle2,
  Clock,
  Bookmark,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { ClientTrackedIssue } from "@/lib/workspace/storage";
import { IssueBreakdown } from "../explore/issue-breakdown";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface TrackedIssueCardProps {
  item: ClientTrackedIssue;
  onStatusChange: (
    id: string,
    status: "saved" | "interested" | "in_progress" | "completed"
  ) => void;
  onEditNotes: (item: ClientTrackedIssue) => void;
  onLinkPr: (item: ClientTrackedIssue) => void;
  onRemove: (id: string) => void;
}

export function TrackedIssueCard({
  item,
  onStatusChange,
  onEditNotes,
  onLinkPr,
  onRemove,
}: TrackedIssueCardProps) {
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="warning">In Progress</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "interested":
        return <Badge variant="indigo">Interested</Badge>;
      case "saved":
      default:
        return <Badge variant="default">Saved</Badge>;
    }
  };

  return (
    <div className="glass-card-interactive p-4 sm:p-5 space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <a
            href={`https://github.com/${item.repoOwner}/${item.repoName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-semibold text-muted-foreground hover:text-foreground transition-colors max-w-[160px] sm:max-w-none truncate"
          >
            {item.repoOwner}/{item.repoName}
          </a>

          {item.language && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground">
              {item.language}
            </span>
          )}

          {item.difficulty && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
              {item.difficulty}
            </span>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md hover:bg-muted transition-colors"
          >
            {getStatusBadge(item.status)}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl border border-border bg-white p-1 shadow-2xl text-xs space-y-0.5 animate-in fade-in zoom-in-95">
              {(["saved", "interested", "in_progress", "completed"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    onStatusChange(item.id, st);
                    setShowStatusMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between capitalize ${
                    item.status === st
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{st.replace("_", " ")}</span>
                  {item.status === st && <CheckCircle2 className="h-3 w-3" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Title & Link */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs font-bold text-muted-foreground shrink-0">
            #{item.issueNumber}
          </span>
          <a
            href={item.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug line-clamp-2"
          >
            {item.title}
          </a>
        </div>
      </div>

      {/* Notes Display Snippet */}
      {item.notes ? (
        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground flex items-start gap-2">
          <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <p className="line-clamp-2 italic leading-relaxed text-foreground/90">{item.notes}</p>
        </div>
      ) : null}

      {/* PR verification link if completed */}
      {item.status === "completed" && (
        <div className="flex items-center gap-2 text-xs">
          {item.isPrConfirmed && item.prUrl ? (
            <a
              href={item.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono text-[11px] hover:underline"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Verified PR Attached</span>
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onLinkPr(item)}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
            >
              <GitPullRequest className="h-3 w-3" />
              <span>+ Link GitHub Pull Request</span>
            </button>
          )}
        </div>
      )}

      {/* Expandable Issue Breakdown */}
      {showBreakdown && (
        <IssueBreakdown
          title={item.title}
          labels={item.labels}
          language={item.language}
          owner={item.repoOwner}
          repo={item.repoName}
          htmlUrl={item.htmlUrl}
        />
      )}

      {/* Footer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditNotes(item)}
            className="h-8 sm:h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5 sm:px-2"
          >
            <FileText className="h-3 w-3" />
            <span>{item.notes ? "Edit Notes" : "+ Add Note"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="h-8 sm:h-7 text-xs text-cyan-400 hover:text-cyan-300 gap-1 px-2.5 sm:px-2"
          >
            <Sparkles className="h-3 w-3" />
            <span>{showBreakdown ? "Hide Breakdown" : "Breakdown & Skills"}</span>
          </Button>

          {item.status === "completed" && !item.isPrConfirmed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLinkPr(item)}
              className="h-8 sm:h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5 sm:px-2"
            >
              <GitPullRequest className="h-3 w-3" />
              <span>Link PR</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={item.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs"
            title="Inspect on GitHub"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {confirmDelete ? (
            <div className="flex items-center gap-1 animate-in fade-in">
              <span className="text-[11px] text-destructive font-medium">Remove?</span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-0.5 rounded text-[11px] border border-border hover:bg-muted transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              title="Remove from Workspace"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
