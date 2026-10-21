"use client";

import * as React from "react";
import Image from "next/image";
import {
  Star,
  GitFork,
  ExternalLink,
  Calendar,
  Code2,
  Scale,
  Save,
  Download,
  Check,
  AlertCircle,
  Clock,
} from "lucide-react";
import { RepositoryAnalysisPayload } from "@/lib/github/types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { generateIssuesCsv, generateRepositoryMarkdownReport } from "@/lib/export/formatters";

interface RepoHeaderProps {
  data: RepositoryAnalysisPayload;
  onRefresh?: () => void;
}

export function RepoHeader({ data, onRefresh }: RepoHeaderProps) {
  const { repository, health, rateLimit, issues } = data;
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const handleSaveSnapshot = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repository.owner,
          repo: repository.repo,
          repoName: repository.fullName,
          description: repository.description || null,
          stars: Math.max(0, Math.round(repository.stars || 0)),
          forks: Math.max(0, Math.round(repository.forks || 0)),
          openIssues: Math.max(0, Math.round(repository.openIssuesCount || 0)),
          openPrs: Math.max(0, Math.round(repository.openPrCount || 0)),
          healthScore: Math.max(0, Math.min(100, Math.round(health.score || 0))),
          primaryLanguage: repository.language || null,
          dataSnapshot: JSON.stringify(data),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save snapshot");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error saving snapshot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCsv = () => {
    const csvContent = generateIssuesCsv(issues, repository.fullName);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${repository.owner}-${repository.repo}-issues.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMarkdown = () => {
    const mdContent = generateRepositoryMarkdownReport(data);
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${repository.owner}-${repository.repo}-report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
        {/* Repository Identification */}
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 w-full lg:w-auto">
          <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl border border-border/70 dark:border-white/10 bg-muted shadow-sm">
            <Image
              src={`https://github.com/${repository.owner}.png`}
              alt={repository.owner}
              width={56}
              height={56}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground break-all sm:break-normal">
                <span className="text-muted-foreground font-normal">{repository.owner}/</span>
                {repository.repo}
              </h1>

              {repository.isArchived && (
                <Badge variant="destructive" className="text-[10px]">
                  Archived
                </Badge>
              )}

              {rateLimit && (
                <span className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  API Quota: {rateLimit.remaining}/{rateLimit.limit}
                </span>
              )}
            </div>

            {repository.description ? (
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed mb-3">
                {repository.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic mb-3">No description provided.</p>
            )}

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                {formatNumber(repository.stars)}
              </span>

              <span className="flex items-center gap-1 font-medium text-foreground">
                <GitFork className="h-3.5 w-3.5" />
                {formatNumber(repository.forks)}
              </span>

              {repository.language && (
                <span className="flex items-center gap-1 font-medium">
                  <Code2 className="h-3.5 w-3.5 text-primary" />
                  {repository.language}
                </span>
              )}

              {repository.license && (
                <span className="hidden sm:flex items-center gap-1 font-medium">
                  <Scale className="h-3.5 w-3.5" />
                  {repository.license}
                </span>
              )}

              <span className="flex items-center gap-1 text-[11px] sm:text-xs">
                <Calendar className="h-3.5 w-3.5" />
                Updated {formatDate(repository.pushedAt)}
              </span>

              <a
                href={repository.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <span>GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-2 w-full lg:w-auto shrink-0 justify-start lg:justify-end pt-3 lg:pt-0">
          <Button
            variant={savedSuccess ? "secondary" : "default"}
            onClick={handleSaveSnapshot}
            isLoading={isSaving}
            className="h-11 sm:h-9 text-sm sm:text-xs px-4 sm:px-3 gap-2 font-semibold col-span-2 sm:col-auto w-full sm:w-auto rounded-xl order-first sm:order-last shadow-sm"
          >
            {savedSuccess ? (
              <>
                <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                <span>Snapshot Saved</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span>Save Snapshot</span>
              </>
            )}
          </Button>

          <Button
            variant="glass"
            onClick={handleExportCsv}
            className="h-11 sm:h-9 text-sm sm:text-xs px-3.5 sm:px-3 gap-2 font-medium w-full sm:w-auto rounded-xl"
          >
            <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="glass"
            onClick={handleExportMarkdown}
            className="h-11 sm:h-9 text-sm sm:text-xs px-3.5 sm:px-3 gap-2 font-medium w-full sm:w-auto rounded-xl"
          >
            <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span><span className="inline sm:hidden">Export MD</span><span className="hidden sm:inline">Export Markdown</span></span>
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="mt-4 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}
    </div>
  );
}
