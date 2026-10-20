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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 font-semibold text-base text-foreground">
            <History className="h-5 w-5 text-primary" />
            <span>Saved Repository Snapshots</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-3 flex-1">
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
              <p className="text-sm font-medium text-foreground mb-1">No saved snapshots yet</p>
              <p className="text-xs max-w-sm mx-auto">
                Analyze any repository, then click the <strong>Save Snapshot</strong> button in the
                dashboard to persist your intelligence reports here.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
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
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {report.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
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

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/repo/${report.owner}/${report.repo}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <span>View</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={deletingId === report.id}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
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
        <div className="border-t border-border px-6 py-3 bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
