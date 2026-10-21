"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Sliders, ArrowRight, RotateCcw, Compass, Loader2 } from "lucide-react";
import { BeginnerIssue } from "@/lib/github/search";
import { calculateRecommendationScore, RecommendationMatch, UserPreferencesData } from "@/lib/recommendations/matcher";
import { BeginnerIssueCard } from "@/components/explore/beginner-issue-card";
import { ClientTrackedIssue } from "@/lib/workspace/storage";
import { Button } from "@/components/ui/button";

interface PersonalizedRecommendationsProps {
  preferences: UserPreferencesData;
  trackedIssues: ClientTrackedIssue[];
  onTrackIssue: (issue: BeginnerIssue, status: "saved" | "interested" | "in_progress" | "completed") => void;
  onTriageIssue: (issue: BeginnerIssue) => void;
  onOpenCalibration?: () => void;
}

export function PersonalizedRecommendations({
  preferences,
  trackedIssues,
  onTrackIssue,
  onTriageIssue,
  onOpenCalibration,
}: PersonalizedRecommendationsProps) {
  const [issues, setIssues] = React.useState<BeginnerIssue[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRecommendations = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Query beginner issues using user's top preferred language if specified
      const langParam = preferences.languages[0] || "all";
      const params = new URLSearchParams();
      if (langParam && langParam !== "all") {
        params.set("lang", langParam);
      }
      params.set("difficulty", preferences.experienceLevel === "beginner" ? "good first issue" : "help wanted");
      params.set("perPage", "15");

      const res = await fetch(`/api/explore?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load personalized recommendations.");
        return;
      }

      setIssues(data.issues || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error contacting explore service.");
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  React.useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Score and sort issues by relevance
  const scoredIssues = React.useMemo(() => {
    return issues
      .map((issue) => ({
        issue,
        match: calculateRecommendationScore(issue, preferences),
      }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [issues, preferences]);

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-xs text-muted-foreground">
          Calibrating recommendations against your preferred languages ({preferences.languages.slice(0, 3).join(", ")}) &amp; experience level...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/60 p-8 text-center max-w-md mx-auto space-y-3">
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button size="sm" onClick={fetchRecommendations} className="text-xs">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Retry Recommendations
        </Button>
      </div>
    );
  }

  if (scoredIssues.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-3">
        <Compass className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <h3 className="text-base font-semibold text-foreground">No matches found for your current preferences</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Try expanding your preferred languages or updating your experience level in your profile settings.
        </p>
        <div className="pt-2 flex items-center justify-center gap-2">
          {onOpenCalibration ? (
            <button
              type="button"
              onClick={onOpenCalibration}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Calibrate Tech Stack</span>
            </button>
          ) : (
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Customize Tech Stack</span>
            </Link>
          )}
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <span>Explore All Issues</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Explanation Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span>
            Scored for your stack:{" "}
            <span className="font-mono text-primary font-bold">
              {preferences.languages.slice(0, 3).join(", ")}
            </span>{" "}
            • Level: <span className="capitalize font-bold text-primary">{preferences.experienceLevel}</span>
          </span>
        </div>
        {onOpenCalibration ? (
          <button
            type="button"
            onClick={onOpenCalibration}
            className="text-primary hover:underline font-semibold inline-flex items-center gap-1 shrink-0"
          >
            <Sliders className="h-3 w-3" />
            <span>Calibrate preferences</span>
          </button>
        ) : (
          <Link
            href="/profile"
            className="text-primary hover:underline font-semibold inline-flex items-center gap-1 shrink-0"
          >
            <span>Adjust preferences</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Scored Issue Cards */}
      <div className="space-y-3.5">
        {scoredIssues.map(({ issue, match }) => {
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
              onTrackIssue={onTrackIssue}
              onTriageIssue={onTriageIssue}
            />
          );
        })}
      </div>
    </div>
  );
}
