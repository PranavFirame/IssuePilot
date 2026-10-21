"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Compass,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Layers,
} from "lucide-react";
import { BeginnerIssue } from "@/lib/github/search";
import { calculateRecommendationScore, UserPreferencesData } from "@/lib/recommendations/matcher";
import {
  fetchTrackedIssues,
  fetchUserPreferences,
  saveUserPreferences,
  trackIssue,
  ClientTrackedIssue,
} from "@/lib/workspace/storage";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FilterPanel } from "@/components/explore/filter-panel";
import { BeginnerIssueCard } from "@/components/explore/beginner-issue-card";
import { PreferenceModal } from "@/components/recommendations/preference-modal";
import { AiTriageModal } from "@/components/triage/ai-triage-modal";
import { SavedReportsModal } from "@/components/reports/saved-reports-modal";
import { Button } from "@/components/ui/button";
import { NormalizedIssue } from "@/lib/github/types";

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state
  const query = searchParams.get("q") || "";
  const language = searchParams.get("lang") || "all";
  const difficulty = searchParams.get("difficulty") || "all";
  const sort = searchParams.get("sort") || "updated";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [issues, setIssues] = React.useState<BeginnerIssue[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = React.useState(false);
  const [resetAt, setResetAt] = React.useState<string | undefined>(undefined);

  const [trackedIssues, setTrackedIssues] = React.useState<ClientTrackedIssue[]>([]);
  const [preferences, setPreferences] = React.useState<UserPreferencesData>({
    languages: ["TypeScript", "JavaScript", "Python"],
    experienceLevel: "beginner",
    topics: ["web", "react", "tools"],
    monthlyGoal: 3,
  });

  const [isPrefsOpen, setIsPrefsOpen] = React.useState(false);
  const [isSavedReportsOpen, setIsSavedReportsOpen] = React.useState(false);
  const [selectedIssueForTriage, setSelectedIssueForTriage] = React.useState<NormalizedIssue | null>(null);

  // Load user preferences & tracked issues
  React.useEffect(() => {
    fetchUserPreferences().then(setPreferences);
    fetchTrackedIssues().then(setTrackedIssues);
  }, []);

  // Fetch search issues
  const loadIssues = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsRateLimit(false);

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (language && language !== "all") params.set("lang", language);
    if (difficulty && difficulty !== "all") params.set("difficulty", difficulty);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    params.set("perPage", "15");

    try {
      const res = await fetch(`/api/explore?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load issues.");
        if (data.isRateLimit) {
          setIsRateLimit(true);
          setResetAt(data.resetAt);
        }
        return;
      }

      setIssues(data.issues || []);
      setTotalCount(data.totalCount || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error contacting explore service.");
    } finally {
      setIsLoading(false);
    }
  }, [query, language, difficulty, sort, page]);

  React.useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Handle filter changes and push to URL
  const handleFilterChange = (newFilters: {
    query?: string;
    language?: string;
    difficulty?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFilters.query !== undefined) {
      if (newFilters.query) params.set("q", newFilters.query);
      else params.delete("q");
    }
    if (newFilters.language !== undefined) {
      if (newFilters.language !== "all") params.set("lang", newFilters.language);
      else params.delete("lang");
    }
    if (newFilters.difficulty !== undefined) {
      if (newFilters.difficulty !== "all") params.set("difficulty", newFilters.difficulty);
      else params.delete("difficulty");
    }
    if (newFilters.sort !== undefined) {
      params.set("sort", newFilters.sort);
    }
    params.set("page", "1");
    router.push(`/explore?${params.toString()}`);
  };

  const handleResetFilters = () => {
    router.push("/explore");
  };

  const handleApplySavedSearch = (saved: {
    query: string;
    language: string;
    difficulty: string;
    sort: string;
  }) => {
    const params = new URLSearchParams();
    if (saved.query) params.set("q", saved.query);
    if (saved.language && saved.language !== "all") params.set("lang", saved.language);
    if (saved.difficulty && saved.difficulty !== "all") params.set("difficulty", saved.difficulty);
    if (saved.sort) params.set("sort", saved.sort);
    params.set("page", "1");
    router.push(`/explore?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/explore?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTrackIssue = async (
    issue: BeginnerIssue,
    status: "saved" | "interested" | "in_progress" | "completed"
  ) => {
    const updatedItem = await trackIssue(issue, status);
    setTrackedIssues((prev) => {
      const filtered = prev.filter(
        (i) =>
          !(
            i.repoOwner === issue.repository.owner &&
            i.repoName === issue.repository.name &&
            i.issueNumber === issue.number
          )
      );
      return [updatedItem, ...filtered];
    });
  };

  const handleSavePreferences = async (newPrefs: UserPreferencesData) => {
    await saveUserPreferences(newPrefs);
    setPreferences(newPrefs);
  };

  // Convert BeginnerIssue to NormalizedIssue for the AI Triage Modal
  const openTriageModal = (issue: BeginnerIssue) => {
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

  const totalPages = Math.min(20, Math.max(1, Math.ceil(totalCount / 15)));

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar onOpenSavedReports={() => setIsSavedReportsOpen(true)} />

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Open Source Starter Radar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Explore Beginner-Friendly Issues
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Curated opportunities tagged <code>good first issue</code>, <code>help wanted</code>, and{" "}
              <code>documentation</code> across active GitHub repositories with explainable relevance scoring.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/workspace")}
              className="text-xs h-9 gap-1.5"
            >
              <Bookmark className="h-3.5 w-3.5 text-primary" />
              <span>My Workspace</span>
              {trackedIssues.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-mono">
                  {trackedIssues.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <FilterPanel
          query={query}
          language={language}
          difficulty={difficulty}
          sort={sort}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onOpenPreferences={() => setIsPrefsOpen(true)}
          onApplySavedSearch={handleApplySavedSearch}
        />

        {/* Rate limit warning banner */}
        {isRateLimit && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">GitHub Search API Rate Limit Reached</p>
              <p className="text-muted-foreground mt-0.5">
                GitHub unauthenticated search requests are temporarily throttled. Reset at{" "}
                {resetAt ? new Date(resetAt).toLocaleTimeString() : "soon"}. Add a <code>GITHUB_TOKEN</code> to
                your <code>.env</code> file for 30 requests/minute.
              </p>
            </div>
          </div>
        )}

        {/* Issues List */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-36 rounded-xl bg-card/60 border border-border" />
            ))}
          </div>
        ) : error && !isRateLimit ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3 max-w-lg mx-auto my-8">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <h3 className="text-base font-semibold text-foreground">Failed to Load Issues</h3>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button size="sm" onClick={loadIssues} className="text-xs">
              Retry Search
            </Button>
          </div>
        ) : issues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/40 space-y-3">
            <Compass className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">No matching beginner issues found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try removing some search filters, switching language to &quot;All&quot;, or selecting a different
              difficulty tag.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                Found {totalCount.toLocaleString()} issues • Page {page} of {totalPages}
              </span>
              <span>Sorted by {sort.replace("_", " ")}</span>
            </div>

            {issues.map((issue) => {
              const match = calculateRecommendationScore(issue, preferences);
              const tracked = trackedIssues.find(
                (t) =>
                  t.repoOwner === issue.repository.owner &&
                  t.repoName === issue.repository.name &&
                  t.issueNumber === issue.number
              );

              return (
                <BeginnerIssueCard
                  key={issue.id}
                  issue={issue}
                  match={match}
                  isSaved={Boolean(tracked)}
                  currentStatus={tracked?.status}
                  onTrackIssue={handleTrackIssue}
                  onTriageIssue={openTriageModal}
                />
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/60 text-xs text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="h-8 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>

            <span className="font-mono">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="h-8 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}
      </main>

      <Footer />

      {/* Preferences Modal */}
      <PreferenceModal
        isOpen={isPrefsOpen}
        preferences={preferences}
        onClose={() => setIsPrefsOpen(false)}
        onSave={handleSavePreferences}
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

export default function ExplorePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ExploreContent />
    </React.Suspense>
  );
}
