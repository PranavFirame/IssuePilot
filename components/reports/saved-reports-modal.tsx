"use client";

import * as React from "react";
import Link from "next/link";
import { X, Trash2, ExternalLink, Calendar, Star, GitFork, AlertCircle, History } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";

interface SavedReportItem {
  id: string;
  owner: string;
  repo: string;
  repoName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  openPrs: number;
  healthScore: number;
  primaryLanguage: string | null;
  createdAt: string;
}

interface SavedReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedReportsModal({ isOpen, onClose }: SavedReportsModalProps) {
  const [reports, setReports] = React.useState<SavedReportItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch saved reports.");
      const data = await res.json();
      setReports(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete snapshot.");
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting report");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/60 dark:bg-background/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card relative w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-2xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 dark:border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 bg-muted/30 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5 font-semibold text-base text-foreground">
            <div className="p-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary backdrop-blur-md shrink-0">
              <History className="h-4 w-4" />
            </div>
            <span className="text-sm sm:text-base truncate">Saved Repository Snapshots</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-3 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading saved snapshots...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-3 text-xs text-destructive rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-foreground mb-1">No saved analyses yet</p>
              <p className="text-xs max-w-sm mx-auto">
                Repositories you analyze or snapshot are automatically persisted here and in your{" "}
                <strong>Workspace</strong> for quick access.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link
                      href={`/repo/${report.owner}/${report.repo}`}
                      onClick={onClose}
                      className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate"
                    >
                      {report.owner}/{report.repo}
                    </Link>
                    <Badge
                      variant={report.healthScore >= 80 ? "success" : report.healthScore >= 60 ? "warning" : "destructive"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      Score: {report.healthScore}/100
                    </Badge>
                  </div>

                  {report.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 sm:truncate mb-2">
                      {report.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      {formatNumber(report.stars)}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      {formatNumber(report.forks)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(report.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 w-full sm:w-auto">
                  <Link
                    href={`/repo/${report.owner}/${report.repo}`}
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-1 sm:flex-initial min-h-[32px]"
                  >
                    <span>View Analysis</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={deletingId === report.id}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 min-h-[32px] min-w-[32px] flex items-center justify-center"
                    aria-label="Delete snapshot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 sm:px-6 py-3 bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8 px-4">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
