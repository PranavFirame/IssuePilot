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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-primary/10 text-primary border border-primary/20": variant === "default",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "border border-border text-foreground": variant === "outline",
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20":
            variant === "success",
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20":
            variant === "warning",
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20":
            variant === "destructive",
          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20":
            variant === "indigo",
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20":
            variant === "purple",
        },
        className
      )}
      {...props}
    />
  );
}
