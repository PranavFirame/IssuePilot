"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  GitPullRequest,
  Sparkles,
  Target,
  Sliders,
  History,
  ShieldCheck,
  User,
  ArrowRight,
  ExternalLink,
  Trash2,
  BarChart3,
  Star,
  GitFork,
  Search,
} from "lucide-react";
import {
  ClientTrackedIssue,
  fetchTrackedIssues,
  fetchUserPreferences,
  removeTrackedIssue,
  updateTrackedIssueStatus,
  trackIssue,
} from "@/lib/workspace/storage";
import { UserPreferencesData } from "@/lib/recommendations/matcher";
import { BeginnerIssue } from "@/lib/github/search";
import { NormalizedIssue } from "@/lib/github/types";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/components/auth/auth-provider";
import { ContributionStats } from "@/components/workspace/contribution-stats";
import { TrackedIssueCard } from "@/components/workspace/tracked-issue-card";
import { PersonalizedRecommendations } from "@/components/workspace/personalized-recommendations";
import { NotesModal } from "@/components/workspace/notes-modal";
import { LinkPrModal } from "@/components/workspace/link-pr-modal";
import { AiTriageModal } from "@/components/triage/ai-triage-modal";
import { SavedReportsModal } from "@/components/reports/saved-reports-modal";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber } from "@/lib/utils";

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as any) || "tracked";

  const { user, isAuthenticated } = useAuth();

  const [trackedIssues, setTrackedIssues] = React.useState<ClientTrackedIssue[]>([]);
  const [recentlyViewed, setRecentlyViewed] = React.useState<any[]>([]);
  const [savedReports, setSavedReports] = React.useState<any[]>([]);
  const [preferences, setPreferences] = React.useState<UserPreferencesData>({
    languages: ["TypeScript", "JavaScript", "Python"],
    experienceLevel: "beginner",
    topics: ["web", "react", "tools"],
    monthlyGoal: 3,
  });

  const [mainView, setMainView] = React.useState<"tracked" | "recommendations" | "analyzed" | "recent" | "goals">(
    ["tracked", "recommendations", "analyzed", "recent", "goals"].includes(initialView) ? initialView : "tracked"
  );
  const [activeTab, setActiveTab] = React.useState<"all" | "saved" | "interested" | "in_progress" | "completed">("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const [quickRepoInput, setQuickRepoInput] = React.useState("");

  const [editingNotesItem, setEditingNotesItem] = React.useState<ClientTrackedIssue | null>(null);
  const [linkingPrItem, setLinkingPrItem] = React.useState<ClientTrackedIssue | null>(null);
  const [selectedIssueForTriage, setSelectedIssueForTriage] = React.useState<NormalizedIssue | null>(null);
  const [isSavedReportsOpen, setIsSavedReportsOpen] = React.useState(false);

  const loadWorkspaceData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [issues, prefs] = await Promise.all([fetchTrackedIssues(), fetchUserPreferences()]);
      setTrackedIssues(issues);
      setPreferences(prefs);

      // Load recently viewed & saved analysis reports in parallel
      const [workspaceRes, reportsRes] = await Promise.all([
        fetch("/api/workspace"),
        fetch("/api/reports"),
      ]);

      if (workspaceRes.ok) {
        const data = await workspaceRes.json();
        setRecentlyViewed(data.recentlyViewed || []);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        if (Array.isArray(reportsData)) {
          setSavedReports(reportsData);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  React.useEffect(() => {
    const view = searchParams.get("view");
    if (view && ["tracked", "recommendations", "analyzed", "recent", "goals"].includes(view)) {
      setMainView(view as any);
    }
  }, [searchParams]);

  const handleStatusChange = async (
    id: string,
    status: "saved" | "interested" | "in_progress" | "completed"
  ) => {
    await updateTrackedIssueStatus(id, status);
    setTrackedIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status, updatedAt: new Date().toISOString() } : i))
    );
  };

  const handleSaveNotes = async (notes: string) => {
    if (!editingNotesItem) return;
    await updateTrackedIssueStatus(editingNotesItem.id, editingNotesItem.status, notes);
    setTrackedIssues((prev) =>
      prev.map((i) => (i.id === editingNotesItem.id ? { ...i, notes } : i))
    );
  };

  const handleLinkPr = async (prUrl: string) => {
    if (!linkingPrItem) return;
    await updateTrackedIssueStatus(
      linkingPrItem.id,
      linkingPrItem.status,
      linkingPrItem.notes || undefined,
      prUrl
    );
    const isPrConfirmed = Boolean(prUrl && /github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test(prUrl));
    setTrackedIssues((prev) =>
      prev.map((i) => (i.id === linkingPrItem.id ? { ...i, prUrl, isPrConfirmed } : i))
    );
  };

  const handleRemove = async (id: string) => {
    await removeTrackedIssue(id);
    setTrackedIssues((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const res = await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // Handle error
    }
  };

  const handleTrackIssueFromRecommendations = async (
    issue: BeginnerIssue,
    status: "saved" | "interested" | "in_progress" | "completed"
  ) => {
    const updated = await trackIssue(issue, status);
    setTrackedIssues((prev) => {
      const filtered = prev.filter(
        (i) =>
          !(
            i.repoOwner === issue.repository.owner &&
            i.repoName === issue.repository.name &&
            i.issueNumber === issue.number
          )
      );
      return [updated, ...filtered];
    });
  };

  const handleOpenTriage = (issue: BeginnerIssue) => {
    const normalized: NormalizedIssue = {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      author: issue.author,
      labels: issue.labels,
      commentsCount: issue.commentsCount,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      closedAt: null,
      htmlUrl: issue.htmlUrl,
      isPullRequest: false,
      ageInDays: issue.ageInDays,
      isStale: issue.freshness === "stale",
    };
    setSelectedIssueForTriage(normalized);
  };

  const filteredIssues = React.useMemo(() => {
    if (activeTab === "all") return trackedIssues;
    return trackedIssues.filter((i) => i.status === activeTab);
  }, [trackedIssues, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar onOpenSavedReports={() => setIsSavedReportsOpen(true)} />

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Contributor Profile Header Banner */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-border bg-card shrink-0">
                <Image
                  src={user.avatarUrl}
                  alt={user.name || user.email}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary font-bold text-lg shrink-0">
                {isAuthenticated && user
                  ? (user.name || user.email).charAt(0).toUpperCase()
                  : <Bookmark className="h-6 w-6" />}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {isAuthenticated && user
                    ? `Welcome, ${user.name || user.email.split("@")[0]}`
                    : "Contributor Workspace"}
                </h1>
                {user?.githubUsername && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                <span>
                  Stack: <strong className="text-foreground">{preferences.languages.slice(0, 3).join(", ")}</strong>
                </span>
                <span>•</span>
                <span>
                  Goal: <strong className="text-foreground">{preferences.monthlyGoal} issues/month</strong>
                </span>
                <span>•</span>
                <span>
                  Bookmarks: <strong className="text-primary">{trackedIssues.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Saved Analyses: <strong className="text-cyan-400">{savedReports.length}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/80 bg-background/50 hover:bg-accent text-xs font-semibold text-foreground transition-colors"
            >
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>Edit Preferences</span>
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Explore Starter Issues</span>
            </Link>
          </div>
        </div>

        {/* Unauthenticated Guest Notification */}
        {!isAuthenticated && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>
                You are browsing as a guest. <strong className="text-foreground">Sign in</strong> to sync your bookmarks, analyzed repository reports, and private notes across devices.
              </span>
            </div>
            <Link
              href="/auth/signin?redirect=/workspace"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
            >
              <span>Sign In or Create Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Main Workspace View Switcher */}
        <div className="flex border-b border-border/80 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMainView("tracked")}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              mainView === "tracked"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>Tracked Issues</span>
            <span className="px-1.5 py-0.2 rounded-full bg-muted text-[10px] font-mono">
              {trackedIssues.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainView("recommendations")}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              mainView === "recommendations"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Recommended for You</span>
          </button>

          <button
            type="button"
            onClick={() => setMainView("analyzed")}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              mainView === "analyzed"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <span>Analyzed Repositories</span>
            <span className="px-1.5 py-0.2 rounded-full bg-muted text-[10px] font-mono">
              {savedReports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainView("recent")}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              mainView === "recent"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4 text-muted-foreground" />
            <span>Recently Viewed</span>
            {recentlyViewed.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-muted text-[10px] font-mono">
                {recentlyViewed.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainView("goals")}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              mainView === "goals"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Target className="h-4 w-4 text-emerald-400" />
            <span>Goals &amp; Progress</span>
          </button>
        </div>

        {/* View 1: Tracked Issues */}
        {mainView === "tracked" && (
          <div className="space-y-4">
            {/* Status Filter Sub-Tabs */}
            <div className="flex border-b border-border/40 gap-6 overflow-x-auto text-xs">
              {(
                [
                  { key: "all", label: "All Statuses", count: trackedIssues.length },
                  {
                    key: "saved",
                    label: "Saved",
                    count: trackedIssues.filter((i) => i.status === "saved").length,
                  },
                  {
                    key: "interested",
                    label: "Interested",
                    count: trackedIssues.filter((i) => i.status === "interested").length,
                  },
                  {
                    key: "in_progress",
                    label: "In Progress",
                    count: trackedIssues.filter((i) => i.status === "in_progress").length,
                  },
                  {
                    key: "completed",
                    label: "Completed",
                    count: trackedIssues.filter((i) => i.status === "completed").length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 pb-2 font-medium border-b-2 transition-all ${
                    activeTab === tab.key
                      ? "border-primary text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Tracked List */}
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-28 rounded-xl bg-card/60 border border-border" />
                ))}
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40 space-y-3">
                <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <h3 className="text-base font-semibold text-foreground">
                  No issues in &ldquo;{activeTab.replace("_", " ")}&rdquo;
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Discover beginner-friendly starter tickets on the Explore page and track them to manage your progress.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/explore")}
                    className="text-xs"
                  >
                    Browse Starter Issues
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setMainView("recommendations")}
                    className="text-xs"
                  >
                    View Recommended Issues
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIssues.map((item) => (
                  <TrackedIssueCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onEditNotes={(it) => setEditingNotesItem(it)}
                    onLinkPr={(it) => setLinkingPrItem(it)}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* View 2: Personalized Recommendations */}
        {mainView === "recommendations" && (
          <PersonalizedRecommendations
            preferences={preferences}
            trackedIssues={trackedIssues}
            onTrackIssue={handleTrackIssueFromRecommendations}
            onTriageIssue={handleOpenTriage}
          />
        )}

        {/* View 3: Analyzed Repositories */}
        {mainView === "analyzed" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card/40 text-xs">
              <div>
                <p className="font-semibold text-foreground">Saved Repository Snapshots &amp; Analyses</p>
                <p className="text-muted-foreground mt-0.5">
                  Every repository analyzed in IssuePilot is automatically saved so you can review metrics anytime.
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (quickRepoInput.trim()) {
                    router.push(`/repo/${quickRepoInput.trim().replace(/^https?:\/\/github\.com\//, "")}`);
                  }
                }}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    value={quickRepoInput}
                    onChange={(e) => setQuickRepoInput(e.target.value)}
                    placeholder="Analyze repo (owner/repo)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Button type="submit" size="sm" className="text-xs h-8 shrink-0">
                  Analyze
                </Button>
              </form>
            </div>

            {savedReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40 space-y-3">
                <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <h3 className="text-base font-semibold text-foreground">No analyzed repositories yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Enter any public GitHub repository (e.g. <code>facebook/react</code> or <code>vercel/next.js</code>) to evaluate health scores, detect duplicate tickets, and save intelligence reports.
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/")}
                  className="text-xs mt-2"
                >
                  Analyze a Repository
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col justify-between p-5 rounded-xl border border-border/80 bg-card/60 hover:border-primary/40 transition-colors shadow-sm space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <Link
                          href={`/repo/${report.owner}/${report.repo}`}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors font-mono truncate"
                        >
                          {report.repoName || `${report.owner}/${report.repo}`}
                        </Link>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono border border-primary/30 bg-primary/10 text-primary shrink-0">
                          Health: {report.healthScore}/100
                        </span>
                      </div>

                      {report.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {report.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                        {report.primaryLanguage && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-foreground">
                            {report.primaryLanguage}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          {formatNumber(report.stars || 0)}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <GitFork className="h-3 w-3" />
                          {formatNumber(report.forks || 0)}
                        </span>
                        <span className="font-mono text-[11px]">
                          {report.openIssues || 0} issues
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
                      <span className="text-[11px]">
                        Saved {formatDate(report.updatedAt || report.createdAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Link
                          href={`/repo/${report.owner}/${report.repo}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <span>View Analysis</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View 4: Recently Viewed */}
        {mainView === "recent" && (
          <div className="space-y-4">
            {recentlyViewed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40 space-y-3">
                <History className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <h3 className="text-base font-semibold text-foreground">No recently viewed issues</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  As you inspect beginner issues and repositories, your viewing history will appear here for fast access.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/explore")}
                  className="text-xs mt-2"
                >
                  Explore Beginner Issues
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentlyViewed.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-border/80 bg-card/60 hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-primary">
                          {item.repoOwner}/{item.repoName}#{item.issueNumber}
                        </span>
                        {item.language && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                            {item.language}
                          </span>
                        )}
                      </div>
                      <a
                        href={item.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 mt-0.5"
                      >
                        {item.title}
                      </a>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                      <span>Viewed {formatDate(item.viewedAt)}</span>
                      <a
                        href={item.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md border border-border hover:bg-muted text-foreground transition-colors"
                        title="Open on GitHub"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View 5: Goals & Progress */}
        {mainView === "goals" && (
          <div className="space-y-6">
            <ContributionStats
              issues={trackedIssues}
              monthlyGoal={preferences.monthlyGoal || 3}
            />

            <div className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card/40 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Adjust Monthly Contribution Target</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Currently aiming for {preferences.monthlyGoal} contributions this month.
                </p>
              </div>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground transition-colors shrink-0"
              >
                <Sliders className="h-3.5 w-3.5 text-primary" />
                <span>Adjust Target</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Edit Notes Modal */}
      <NotesModal
        isOpen={Boolean(editingNotesItem)}
        issueTitle={editingNotesItem?.title || ""}
        issueNumber={editingNotesItem?.issueNumber || 0}
        initialNotes={editingNotesItem?.notes}
        onClose={() => setEditingNotesItem(null)}
        onSave={handleSaveNotes}
      />

      {/* Link PR Modal */}
      <LinkPrModal
        isOpen={Boolean(linkingPrItem)}
        issueTitle={linkingPrItem?.title || ""}
        issueNumber={linkingPrItem?.issueNumber || 0}
        initialPrUrl={linkingPrItem?.prUrl}
        onClose={() => setLinkingPrItem(null)}
        onSave={handleLinkPr}
      />

      {/* AI Triage Modal */}
      <AiTriageModal
        issue={selectedIssueForTriage}
        repoFullName={
          selectedIssueForTriage
            ? `${selectedIssueForTriage.author.login}/${selectedIssueForTriage.title}`
            : ""
        }
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

export default function WorkspacePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WorkspaceContent />
    </React.Suspense>
  );
}
