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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Tracked Total */}
      <Card className="p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
        <div className="p-2 sm:p-2.5 rounded-xl border border-primary/20 bg-primary/10 text-primary backdrop-blur-md shrink-0">
          <Bookmark className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <span className="text-lg sm:text-xl font-bold font-mono text-foreground block truncate">{issues.length}</span>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">Tracked Issues</span>
        </div>
      </Card>

      {/* In Progress */}
      <Card className="p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
        <div className="p-2 sm:p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 backdrop-blur-md shrink-0">
          <Clock className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <span className="text-lg sm:text-xl font-bold font-mono text-foreground block truncate">{inProgressCount}</span>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">In Progress</span>
        </div>
      </Card>

      {/* Completed */}
      <Card className="p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
        <div className="p-2 sm:p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 backdrop-blur-md shrink-0">
          <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <span className="text-lg sm:text-xl font-bold font-mono text-foreground block truncate">
            {completedCount}{" "}
            {verifiedPrCount > 0 && (
              <span className="text-[10px] font-normal text-emerald-500">
                ({verifiedPrCount} PRs)
              </span>
            )}
          </span>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">Completed</span>
        </div>
      </Card>

      {/* Monthly Target Goal */}
      <Card className="p-3.5 sm:p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground flex items-center gap-1 text-[11px] sm:text-xs">
            <Target className="h-3.5 w-3.5 text-indigo-400" /> Monthly Goal
          </span>
          <span className="font-mono font-bold text-foreground text-xs sm:text-sm">
            {completedCount}/{monthlyGoal}
          </span>
        </div>

        <div className="h-2 w-full bg-muted rounded-full overflow-hidden my-1">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${goalProgress}%` }}
          />
        </div>

        <span className="text-[10px] text-muted-foreground truncate">
          {goalProgress >= 100 ? "🎉 Goal reached!" : `${goalProgress}% accomplished`}
        </span>
      </Card>
    </div>
  );
}
