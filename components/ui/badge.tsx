import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "destructive"
    | "indigo"
    | "purple";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-primary/15 dark:bg-primary/20 text-primary border border-primary/30": variant === "default",
          "bg-secondary/70 dark:bg-secondary/50 text-secondary-foreground border border-border/60 dark:border-white/10": variant === "secondary",
          "border border-border/80 dark:border-white/15 bg-background/50 dark:bg-card/40 text-foreground": variant === "outline",
          "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30":
            variant === "success",
          "bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30":
            variant === "warning",
          "bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30":
            variant === "destructive",
          "bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30":
            variant === "indigo",
          "bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30":
            variant === "purple",
        },
        className
      )}
      {...props}
    />
  );
}
