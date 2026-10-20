"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CopyCheck,
  FileText,
  PieChart,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { NormalizedIssue, RepositoryAnalysisPayload } from "@/lib/github/types";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RepoHeader } from "@/components/dashboard/repo-header";
import { HealthScoreCard } from "@/components/dashboard/health-score-card";
import { IssueExplorer } from "@/components/dashboard/issue-explorer";
import { DuplicateDetector } from "@/components/triage/duplicate-detector";
import { ActivityCharts } from "@/components/dashboard/activity-charts";
import { AiTriageModal } from "@/components/triage/ai-triage-modal";
import { SavedReportsModal } from "@/components/reports/saved-reports-modal";
import { Button } from "@/components/ui/button";

export default function RepositoryDashboardPage() {
  const params = useParams();
  const router = useRouter();

  const owner = params.owner as string;
  const name = params.name as string;

  const [data, setData] = React.useState<RepositoryAnalysisPayload | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = React.useState(false);
  const [resetAt, setResetAt] = React.useState<string | undefined>(undefined);

  const [activeTab, setActiveTab] = React.useState<"issues" | "duplicates" | "analytics">("issues");
  const [selectedIssueForTriage, setSelectedIssueForTriage] = React.useState<NormalizedIssue | null>(null);
  const [isSavedReportsOpen, setIsSavedReportsOpen] = React.useState(false);

  const loadRepositoryData = React.useCallback(
    async (bypassCache = false) => {
      if (!owner || !name) return;
      setIsLoading(true);
      setError(null);
      setIsRateLimit(false);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo: `${owner}/${name}`,
            bypassCache,
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Failed to analyze repository.");
          if (json.isRateLimit) {
            setIsRateLimit(true);
            setResetAt(json.resetAt);
          }
          return;
        }

        setData(json);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Network error contacting IssuePilot service."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [owner, name]
  );

  React.useEffect(() => {
    loadRepositoryData();
  }, [loadRepositoryData]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar onOpenSavedReports={() => setIsSavedReportsOpen(true)} />

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Analyze another repository</span>
          </button>

          {!isLoading && data && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadRepositoryData(true)}
              className="text-xs h-7 gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh live data</span>
            </Button>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-32 rounded-xl bg-card/60 border border-border" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="h-44 rounded-xl bg-card/60 border border-border" />
              <div className="md:col-span-3 h-44 rounded-xl bg-card/60 border border-border" />
            </div>
            <div className="h-96 rounded-xl bg-card/60 border border-border" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-4 max-w-2xl mx-auto my-12">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Analysis Request Failed</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>

            {isRateLimit && (
              <div className="p-3 rounded-lg bg-card border border-border text-xs text-muted-foreground text-left space-y-1">
                <span className="font-semibold text-foreground block">
                  Tip: Rate Limit Exceeded
                </span>
                <p>
                  Unauthenticated GitHub requests are capped at 60 requests per hour. You can add a
                  free Personal Access Token to <code>GITHUB_TOKEN</code> in your <code>.env</code> file
                  to raise your limit to 5,000 requests per hour.
                </p>
                {resetAt && (
                  <p className="text-[11px] font-mono pt-1 text-primary">
                    Quota resets at: {new Date(resetAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button size="sm" onClick={() => loadRepositoryData(true)}>
                Retry Request
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/")}>
                Return Home
              </Button>
            </div>
          </div>
        )}

        {/* Success / Loaded Dashboard */}
        {!isLoading && data && (
          <div className="space-y-6">
            {/* Demo Fallback Warning Banner if Rate Limited */}
            {(data as any).isDemoFallback && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Rate Limit Active:</strong> Displaying offline demonstration snapshot. Add a{" "}
                    <code>GITHUB_TOKEN</code> to your <code>.env</code> file for 5,000 live requests/hour.
                  </span>
                </div>
                {data.rateLimit?.resetAt && (
                  <span className="font-mono text-[11px] shrink-0 text-muted-foreground">
                    Resets at {new Date(data.rateLimit.resetAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}

            {/* Header */}
            <RepoHeader data={data} onRefresh={() => loadRepositoryData(true)} />

            {/* Health Scorecard */}
            <HealthScoreCard data={data} />

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-border/80 gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("issues")}
                className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "issues"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Issue Explorer & Backlog</span>
                <span className="px-1.5 py-0.2 rounded-full bg-muted text-[11px] font-mono text-muted-foreground">
                  {data.issues.filter((i) => !i.isPullRequest).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("duplicates")}
                className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "duplicates"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <CopyCheck className="h-4 w-4" />
                <span>Duplicate Issue Radar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "analytics"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <PieChart className="h-4 w-4" />
                <span>Repository Analytics</span>
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === "issues" && (
              <IssueExplorer
                issues={data.issues}
                repoFullName={data.repository.fullName}
                onTriageIssue={(issue) => setSelectedIssueForTriage(issue)}
              />
            )}

            {activeTab === "duplicates" && <DuplicateDetector issues={data.issues} />}

            {activeTab === "analytics" && <ActivityCharts data={data} />}
          </div>
        )}
      </main>

      <Footer />

      {/* AI Triage Modal */}
      <AiTriageModal
        issue={selectedIssueForTriage}
        repoFullName={data?.repository.fullName || ""}
        isOpen={Boolean(selectedIssueForTriage)}
        onClose={() => setSelectedIssueForTriage(null)}
      />

      {/* Saved Reports Drawer */}
      <SavedReportsModal
        isOpen={isSavedReportsOpen}
        onClose={() => setIsSavedReportsOpen(false)}
      />
    </div>
  );
}
