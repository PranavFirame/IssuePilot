import * as React from "react";
import Image from "next/image";
import { Users, Tag, Calendar, ExternalLink } from "lucide-react";
import { RepositoryAnalysisPayload } from "@/lib/github/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface ActivityChartsProps {
  data: RepositoryAnalysisPayload;
}

export function ActivityCharts({ data }: ActivityChartsProps) {
  const { labelsDistribution, activityTimeline, repository } = data;

  const totalLabelUsages = labelsDistribution.reduce((acc, l) => acc + l.count, 0) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Label Distribution */}
      <Card className="lg:col-span-2 bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span>Top Issue Labels & Taxonomy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {labelsDistribution.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No labels found on recent issues.
            </p>
          ) : (
            labelsDistribution.slice(0, 8).map((label) => {
              const pct = Math.round((label.count / totalLabelUsages) * 100);
              return (
                <div key={label.name} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-foreground flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: `#${label.color}` }}
                      />
                      {label.name}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {label.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(5, pct)}%`,
                        backgroundColor: `#${label.color}`,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card className="lg:col-span-1 bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" />
            <span>Top Contributors</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {repository.contributors.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Contributor details not accessible for this repository.
            </p>
          ) : (
            repository.contributors.slice(0, 6).map((c) => (
              <div
                key={c.login}
                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Image
                    src={c.avatarUrl}
                    alt={c.login}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full border border-border"
                    unoptimized
                  />
                  <a
                    href={`https://github.com/${c.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-foreground hover:text-primary truncate"
                  >
                    @{c.login}
                  </a>
                </div>

                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {c.contributions.toLocaleString()} commits
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {activityTimeline.length > 0 && (
        <Card className="lg:col-span-3 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-500" />
              <span>Recent Backlog Activity Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {activityTimeline.map((item) => (
                <div
                  key={item.date}
                  className="p-2.5 rounded-lg border border-border bg-muted/20 flex flex-col justify-between text-xs"
                >
                  <span className="text-[11px] font-mono text-muted-foreground mb-1">
                    {item.date.slice(5)}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-500 font-medium">Created:</span>
                      <span className="font-mono font-bold">{item.createdCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-indigo-400 font-medium">Closed:</span>
                      <span className="font-mono font-bold">{item.closedCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
