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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-4 sm:mb-6 flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary shrink-0" />
            <span>Repository intelligence for open-source contributors</span>
          </p>

          {/* Headline — editorial, left-aligned, no gradient */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-[-0.03em] text-foreground leading-[1.12] sm:leading-[1.08] mb-4 sm:mb-6">
            Navigate your GitHub{" "}
            <br className="hidden sm:block" />
            backlog with clarity.
          </h1>

          {/* Supporting copy */}
          <p className="text-sm sm:text-base text-muted-foreground max-w-[52ch] mb-8 sm:mb-10 leading-relaxed">
            Analyze any public repository for health scoring, stale issues, and duplicate detection.
            Discover beginner-friendly contribution opportunities with explainable relevance scoring.
          </p>

          {/* Main form */}
          <form
            onSubmit={(e) => handleSubmit(e)}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 max-w-xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="owner/repo or GitHub URL"
                className="w-full rounded-2xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-card/50 pl-11 pr-4 py-3.5 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background/90 dark:focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-xl shadow-lg shadow-black/5"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              className="h-[50px] px-7 font-semibold text-sm gap-2 rounded-2xl shrink-0 shadow-md active:scale-[0.98]"
            >
              Analyze
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Validation error */}
          {error && (
            <div className="mb-6 flex items-center gap-2 text-sm text-destructive p-3 rounded-xl border border-destructive/20 bg-destructive/10 backdrop-blur-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sample repos + explore link */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground/60 text-xs">Try:</span>
            {SAMPLE_REPOS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleSelectSample(sample.name)}
                className="font-mono text-xs px-2.5 py-1 rounded-lg border border-border/70 dark:border-white/10 bg-card/60 dark:bg-white/5 backdrop-blur-md text-muted-foreground hover:text-foreground hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-pointer shadow-sm"
              >
                {sample.name}
              </button>
            ))}
            <span className="text-muted-foreground/30 hidden sm:inline mx-1">·</span>
            <button
              type="button"
              onClick={() => router.push("/explore")}
              className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1 cursor-pointer text-xs sm:text-sm ml-1"
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
