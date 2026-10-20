import * as React from "react";
import { Badge } from "../ui/badge";

interface DifficultyBadgeProps {
  difficulty: "good first issue" | "help wanted" | "documentation" | "beginner" | "general";
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  switch (difficulty) {
    case "good first issue":
      return (
        <Badge variant="success" className={`font-mono text-[10px] uppercase tracking-wide ${className || ""}`}>
          Good First Issue
        </Badge>
      );
    case "help wanted":
      return (
        <Badge variant="indigo" className={`font-mono text-[10px] uppercase tracking-wide ${className || ""}`}>
          Help Wanted
        </Badge>
      );
    case "documentation":
      return (
        <Badge variant="default" className={`font-mono text-[10px] uppercase tracking-wide ${className || ""}`}>
          Documentation
        </Badge>
      );
    case "beginner":
      return (
        <Badge variant="purple" className={`font-mono text-[10px] uppercase tracking-wide ${className || ""}`}>
          Beginner Friendly
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`font-mono text-[10px] uppercase tracking-wide ${className || ""}`}>
          Open Issue
        </Badge>
      );
  }
}
