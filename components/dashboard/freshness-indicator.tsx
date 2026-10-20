import * as React from "react";
import { Clock } from "lucide-react";

interface FreshnessIndicatorProps {
  freshness: "recent" | "moderate" | "stale";
  updatedAt?: string;
  className?: string;
}

export function FreshnessIndicator({ freshness, updatedAt, className }: FreshnessIndicatorProps) {
  let label = "Recent activity";
  let dotColor = "bg-emerald-500";
  let textColor = "text-emerald-500";

  if (freshness === "moderate") {
    label = "Updated >30d ago";
    dotColor = "bg-amber-500";
    textColor = "text-amber-500";
  } else if (freshness === "stale") {
    label = "No updates in >90d";
    dotColor = "bg-rose-500";
    textColor = "text-muted-foreground";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${textColor} ${
        className || ""
      }`}
      title={
        freshness === "stale"
          ? "No updates in over 90 days. Backlog items may require maintainer re-confirmation."
          : "Active thread"
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
      <span>{label}</span>
    </span>
  );
}
