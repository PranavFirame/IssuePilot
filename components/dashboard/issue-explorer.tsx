"use client";

import * as React from "react";
import Image from "next/image";
import {
  Search,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NormalizedIssue } from "@/lib/github/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { formatDate } from "@/lib/utils";

interface IssueExplorerProps {
  issues: NormalizedIssue[];
  repoFullName: string;
  onTriageIssue: (issue: NormalizedIssue) => void;
}

const ITEMS_PER_PAGE = 10;

export function IssueExplorer({ issues, repoFullName, onTriageIssue }: IssueExplorerProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "open" | "closed">("open");
  const [staleFilter, setStaleFilter] = React.useState<"all" | "stale" | "active">("all");
  const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "comments">("newest");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter out pure pull requests from issue explorer
  const pureIssues = React.useMemo(() => {
    return issues.filter((i) => !i.isPullRequest);
  }, [issues]);

  // Extract unique labels for quick filter pills
  const availableLabels = React.useMemo(() => {
    const map = new Map<string, { color: string; count: number }>();
    for (const issue of pureIssues) {
      for (const l of issue.labels) {
        const cur = map.get(l.name) || { color: l.color, count: 0 };
        cur.count++;
        map.set(l.name, cur);
      }
    }
    return Array.from(map.entries())
      .map(([name, val]) => ({ name, color: val.color, count: val.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [pureIssues]);

  // Apply filters and sorting
  const filteredIssues = React.useMemo(() => {
    return pureIssues
      .filter((issue) => {
        // Status filter
        if (statusFilter !== "all" && issue.state !== statusFilter) return false;

        // Staleness filter
        if (staleFilter === "stale" && !issue.isStale) return false;
        if (staleFilter === "active" && issue.isStale) return false;

        // Label filter
        if (selectedLabel && !issue.labels.some((l) => l.name === selectedLabel)) return false;

        // Search text / number
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchesNum = `#${issue.number}` === q || String(issue.number) === q;
          const matchesTitle = issue.title.toLowerCase().includes(q);
          const matchesAuthor = issue.author.login.toLowerCase().includes(q);
          if (!matchesNum && !matchesTitle && !matchesAuthor) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "comments") {
          return b.commentsCount - a.commentsCount;
        }
        return 0;
      });
  }, [pureIssues, search, statusFilter, staleFilter, selectedLabel, sortBy]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, staleFilter, selectedLabel, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / ITEMS_PER_PAGE));
  const paginatedIssues = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIssues.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIssues, currentPage]);

  return (
    <div className="space-y-4">
      {/* Search and Main Filters Bar */}
      <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues by title, #number, or @author..."
            className="w-full rounded-xl border border-border/80 dark:border-white/10 bg-background/70 dark:bg-card/60 backdrop-blur-md pl-10 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* State and Sort Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Status Tabs */}
          <div className="grid grid-cols-3 sm:inline-flex rounded-xl border border-border/80 dark:border-white/10 p-1 bg-muted/40 dark:bg-white/5 backdrop-blur-md text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("open")}
              className={`px-3 py-1.5 sm:py-1 rounded-lg transition-all cursor-pointer text-center ${
                statusFilter === "open"
                  ? "bg-background dark:bg-card text-foreground font-semibold shadow-sm border border-border/60 dark:border-white/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("closed")}
              className={`px-3 py-1.5 sm:py-1 rounded-lg transition-all cursor-pointer text-center ${
                statusFilter === "closed"
                  ? "bg-background dark:bg-card text-foreground font-semibold shadow-sm border border-border/60 dark:border-white/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Closed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 sm:py-1 rounded-lg transition-all cursor-pointer text-center ${
                statusFilter === "all"
                  ? "bg-background dark:bg-card text-foreground font-semibold shadow-sm border border-border/60 dark:border-white/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Stale Filter */}
            <select
              value={staleFilter}
              onChange={(e) => setStaleFilter(e.target.value as any)}
              className="h-9 sm:h-9 rounded-xl border border-border/80 dark:border-white/10 bg-background/80 dark:bg-card/80 backdrop-blur-md px-3 text-xs text-foreground focus:border-primary/60 focus:outline-none cursor-pointer w-full"
              aria-label="Filter by age"
            >
              <option value="all">Any Age</option>
              <option value="stale">Stale (&gt;90d)</option>
              <option value="active">Active (&lt;90d)</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 sm:h-9 rounded-xl border border-border/80 dark:border-white/10 bg-background/80 dark:bg-card/80 backdrop-blur-md px-3 text-xs text-foreground focus:border-primary/60 focus:outline-none cursor-pointer w-full"
              aria-label="Sort issues"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="comments">Most Comments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Label Filter Pills */}
      {availableLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
          <span className="text-muted-foreground text-[11px] font-medium mr-1 flex items-center gap-1">
            <Tag className="h-3 w-3" /> Labels:
          </span>
          {availableLabels.map((l) => {
            const isSelected = selectedLabel === l.name;
            return (
              <button
                key={l.name}
                type="button"
                onClick={() => setSelectedLabel(isSelected ? null : l.name)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono transition-all border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: `#${l.color}` }}
                />
                <span>{l.name}</span>
                <span className="opacity-60 text-[10px]">({l.count})</span>
              </button>
            );
          })}

          {selectedLabel && (
            <button
              type="button"
              onClick={() => setSelectedLabel(null)}
              className="text-[11px] text-primary hover:underline ml-1"
            >
              Clear label
            </button>
          )}
        </div>
      )}

      {/* Issues List */}
      <div className="space-y-2.5">
        {filteredIssues.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 sm:p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary backdrop-blur-md shadow-sm">
              <Search className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base sm:text-lg font-bold text-foreground tracking-[-0.02em]">No matching issues found</p>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Try adjusting your search criteria, clearing the label filter, or changing status.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setStaleFilter("all");
                  setSelectedLabel(null);
                }}
                className="text-xs"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        ) : (
          paginatedIssues.map((issue) => (
            <div
              key={issue.id}
              className="glass-card-interactive flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4"
            >
              {/* Left Details */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={issue.state === "open" ? "success" : "secondary"}
                    className="text-[10px] px-1.5 py-0 uppercase font-mono"
                  >
                    {issue.state}
                  </Badge>

                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    #{issue.number}
                  </span>

                  {issue.isStale && (
                    <Badge variant="warning" className="text-[10px] gap-1 px-1.5 py-0">
                      <Clock className="h-2.5 w-2.5" />
                      Stale ({issue.ageInDays}d)
                    </Badge>
                  )}

                  <span className="text-[11px] text-muted-foreground">
                    opened {formatDate(issue.createdAt)} by @{issue.author.login}
                  </span>
                </div>

                <a
                  href={issue.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug"
                >
                  <span className="group-hover:underline">{issue.title}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                {/* Labels */}
                {issue.labels.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {issue.labels.map((l) => (
                      <span
                        key={l.id}
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono border border-border"
                        style={{
                          backgroundColor: `#${l.color}15`,
                          borderColor: `#${l.color}40`,
                          color: `#${l.color}`,
                        }}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="font-mono">{issue.commentsCount} comments</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTriageIssue(issue)}
                  className="text-xs h-8 gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/5 text-primary"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Triage</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="text-center sm:text-left">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredIssues.length)} of {filteredIssues.length} issues
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>

            <span className="font-mono text-foreground font-medium px-1">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
