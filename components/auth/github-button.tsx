"use client";

import * as React from "react";
import { Github, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GithubButtonProps {
  returnUrl?: string;
  className?: string;
}

export function GithubButton({ returnUrl, className }: GithubButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGithubClick = () => {
    setIsLoading(true);
    const target = returnUrl
      ? `/api/auth/github?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/api/auth/github";
    window.location.href = target;
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGithubClick}
      disabled={isLoading}
      className={`w-full h-11 border-border/80 bg-background/50 hover:bg-accent/80 font-medium text-sm flex items-center justify-center gap-2.5 transition-all ${
        className || ""
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Github className="h-4 w-4" />
      )}
      <span>Continue with GitHub</span>
    </Button>
  );
}
