"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, AlertCircle, Compass } from "lucide-react";
import { Button } from "../ui/button";
import { parseRepositoryUrl } from "@/lib/github/url-parser";

const SAMPLE_REPOS = [
  { name: "facebook/react", desc: "UI Library" },
  { name: "vercel/next.js", desc: "Next.js" },
  { name: "tailwindlabs/tailwindcss", desc: "Tailwind" },
  { name: "shadcn-ui/ui", desc: "shadcn/ui" },
];

export function HeroSearch() {
  const router = useRouter();
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e?: React.FormEvent, customRepo?: string) => {
    if (e) e.preventDefault();
    const target = customRepo || input;
    setError(null);

    const parsed = parseRepositoryUrl(target);
    if (!parsed.isValid || !parsed.data) {
      setError(parsed.error || "Please enter a valid GitHub repository.");
      return;
    }

    setIsLoading(true);
    router.push(`/repo/${parsed.data.owner}/${parsed.data.repo}`);
  };

  const handleSelectSample = (repoName: string) => {
    setInput(repoName);
    handleSubmit(undefined, repoName);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background orbs — one orchestrated visual moment */}
      <div
        className="hero-orb w-[600px] h-[600px] bg-indigo-600 top-[-120px] left-[-80px]"
        aria-hidden="true"
      />
      <div
        className="hero-orb w-[400px] h-[400px] bg-violet-600 top-[40px] right-[-60px] opacity-[0.08]"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="text-sm font-medium text-muted-foreground mb-6 flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            Repository intelligence for open-source contributors
          </p>

          {/* Headline — editorial, left-aligned, no gradient */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-[-0.03em] text-foreground leading-[1.08] mb-6">
            Navigate your GitHub{" "}
            <br className="hidden sm:block" />
            backlog with clarity.
          </h1>

          {/* Supporting copy */}
          <p className="text-[15px] sm:text-base text-muted-foreground max-w-[52ch] mb-10 leading-relaxed">
            Analyze any public repository for health scoring, stale issues, and duplicate detection.
            Discover beginner-friendly contribution opportunities with explainable relevance scoring.
          </p>

          {/* Main form */}
          <form
            onSubmit={(e) => handleSubmit(e)}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 max-w-xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="owner/repo or GitHub URL"
                className="w-full rounded-xl border border-border bg-card/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all backdrop-blur-sm"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              className="h-[46px] px-6 font-semibold text-sm gap-2 rounded-xl shrink-0"
            >
              Analyze
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Validation error */}
          {error && (
            <div className="mb-6 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sample repos + explore link */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground/60">Try:</span>
            {SAMPLE_REPOS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleSelectSample(sample.name)}
                className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors link-underline underline underline-offset-2 decoration-border hover:decoration-primary/50"
              >
                {sample.name}
              </button>
            ))}
            <span className="text-muted-foreground/30 hidden sm:inline">·</span>
            <button
              type="button"
              onClick={() => router.push("/explore")}
              className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
            >
              Browse beginner issues
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
