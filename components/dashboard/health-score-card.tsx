import { HeartHandshake, AlertTriangle, Clock, GitPullRequest, Activity } from "lucide-react";
import { RepositoryAnalysisPayload } from "@/lib/github/types";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

interface HealthScoreCardProps {
  data: RepositoryAnalysisPayload;
}

export function HealthScoreCard({ data }: HealthScoreCardProps) {
  const { health, repository } = data;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
      case "B":
        return "text-cyan-500 border-cyan-500/30 bg-cyan-500/10";
      case "C":
        return "text-amber-500 border-amber-500/30 bg-amber-500/10";
      case "D":
        return "text-orange-500 border-orange-500/30 bg-orange-500/10";
      default:
        return "text-rose-500 border-rose-500/30 bg-rose-500/10";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Grade and Total Score Card */}
      <Card className="md:col-span-1 bg-card border-border flex flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Health Grade
            </span>
            <HeartHandshake className="h-4 w-4 text-primary" />
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span
              className={`text-4xl font-extrabold px-3 py-1 rounded-lg border font-mono ${getGradeColor(
                health.grade
              )}`}
            >
              {health.grade}
            </span>
            <div>
              <div className="text-2xl font-bold text-foreground">{health.score}/100</div>
              <div className="text-[11px] text-muted-foreground">Aggregate Health</div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground">
          {health.score >= 80 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Excellent maintenance velocity & responsiveness.
            </span>
          ) : health.score >= 60 ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Moderate maintenance with attention needed on older tickets.
            </span>
          ) : (
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              Backlog exhibits high staleness or reduced commit cadence.
            </span>
          )}
        </div>
      </Card>

      {/* Breakdown metrics */}
      <Card className="md:col-span-3 bg-card border-border p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-4">
          Health Breakdown & Velocity Diagnostics
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {/* Activity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" /> Push Velocity
              </span>
              <span className="font-mono font-semibold text-foreground">
                {health.breakdown.activityScore}/25
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(health.breakdown.activityScore / 25) * 100}%` }}
              />
            </div>
          </div>

          {/* Staleness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Staleness Index
              </span>
              <span className="font-mono font-semibold text-foreground">
                {health.breakdown.stalenessScore}/25
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${(health.breakdown.stalenessScore / 25) * 100}%` }}
              />
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <HeartHandshake className="h-3 w-3" /> Resolution Ratio
              </span>
              <span className="font-mono font-semibold text-foreground">
                {health.breakdown.issueHealthScore}/25
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(health.breakdown.issueHealthScore / 25) * 100}%` }}
              />
            </div>
          </div>

          {/* PR Velocity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <GitPullRequest className="h-3 w-3" /> PR Turnover
              </span>
              <span className="font-mono font-semibold text-foreground">
                {health.breakdown.prVelocityScore}/25
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(health.breakdown.prVelocityScore / 25) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Diagnostic counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground text-[11px] block">Open Issues</span>
            <span className="text-base font-bold text-foreground font-mono">
              {repository.openIssuesCount.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[11px] block">Open Pull Requests</span>
            <span className="text-base font-bold text-foreground font-mono">
              {repository.openPrCount.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[11px] block">Stale Issues (&gt;90d)</span>
            <span className="text-base font-bold text-foreground font-mono">
              {health.staleIssuesCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({Math.round(health.staleIssuesRatio * 100)}%)
              </span>
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[11px] block">Median Backlog Age</span>
            <span className="text-base font-bold text-foreground font-mono">
              {health.medianIssueAgeDays} days
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
