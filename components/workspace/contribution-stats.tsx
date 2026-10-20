import * as React from "react";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  GitPullRequest,
  Target,
  Sparkles,
} from "lucide-react";
import { Card } from "../ui/card";
import { ClientTrackedIssue } from "@/lib/workspace/storage";

interface ContributionStatsProps {
  issues: ClientTrackedIssue[];
  monthlyGoal: number;
}

export function ContributionStats({ issues, monthlyGoal }: ContributionStatsProps) {
  const savedCount = issues.filter((i) => i.status === "saved").length;
  const interestedCount = issues.filter((i) => i.status === "interested").length;
  const inProgressCount = issues.filter((i) => i.status === "in_progress").length;
  const completedCount = issues.filter((i) => i.status === "completed").length;
  const verifiedPrCount = issues.filter((i) => i.status === "completed" && i.isPrConfirmed).length;

  const goalProgress = Math.min(100, Math.round((completedCount / (monthlyGoal || 1)) * 100));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Tracked Total */}
      <Card className="p-4 bg-card border-border flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
          <Bookmark className="h-5 w-5" />
        </div>
        <div>
          <span className="text-xl font-bold font-mono text-foreground">{issues.length}</span>
          <span className="text-[11px] text-muted-foreground block">Tracked Issues</span>
        </div>
      </Card>

      {/* In Progress */}
      <Card className="p-4 bg-card border-border flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <span className="text-xl font-bold font-mono text-foreground">{inProgressCount}</span>
          <span className="text-[11px] text-muted-foreground block">In Progress</span>
        </div>
      </Card>

      {/* Completed */}
      <Card className="p-4 bg-card border-border flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <span className="text-xl font-bold font-mono text-foreground">
            {completedCount}{" "}
            {verifiedPrCount > 0 && (
              <span className="text-[10px] font-normal text-emerald-500">
                ({verifiedPrCount} PRs)
              </span>
            )}
          </span>
          <span className="text-[11px] text-muted-foreground block">Completed</span>
        </div>
      </Card>

      {/* Monthly Target Goal */}
      <Card className="p-4 bg-card border-border flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <Target className="h-3.5 w-3.5 text-indigo-400" /> Monthly Goal
          </span>
          <span className="font-mono font-bold text-foreground">
            {completedCount}/{monthlyGoal}
          </span>
        </div>

        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${goalProgress}%` }}
          />
        </div>

        <span className="text-[10px] text-muted-foreground mt-1">
          {goalProgress >= 100 ? "🎉 Monthly goal reached!" : `${goalProgress}% accomplished`}
        </span>
      </Card>
    </div>
  );
}
