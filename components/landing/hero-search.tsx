"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { parseRepositoryUrl } from "@/lib/github/url-parser";

const SAMPLE_REPOS = [
  { name: "facebook/react", desc: "UI Library" },
  { name: "vercel/next.js", desc: "React Framework" },
  { name: "tailwindlabs/tailwindcss", desc: "CSS Engine" },
  { name: "shadcn-ui/ui", desc: "Component System" },
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
    <div className="flex flex-col items-center text-center max-w-3xl mx-auto py-12 sm:py-16 px-4">
      {/* Badge pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary mb-6">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Developer-grade repository triage & backlog intelligence</span>
      </div>

      {/* Main headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-5">
        Master your GitHub backlog with{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400">
          precision & AI
        </span>
      </h1>

      {/* Supporting text */}
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
        Analyze public GitHub repositories in seconds. Audit repository health scores,
        identify stale backlogs, uncover potential duplicate issues, and triage issues
        with structured AI recommendations.
      </p>

      {/* Main Repository Input Form */}
      <div className="w-full max-w-2xl mb-6">
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-xl border border-border bg-card/80 backdrop-blur shadow-lg shadow-primary/5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
        >
          <div className="relative flex-1 w-full flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. facebook/react or https://github.com/owner/repo"
              className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
            className="w-full sm:w-auto h-11 px-6 font-semibold gap-2 shadow-md shrink-0"
          >
            <span>Analyze Repository</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Validation / Error message */}
        {error && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Quick sample pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium mr-1">Try popular repositories:</span>
        {SAMPLE_REPOS.map((sample) => (
          <button
            key={sample.name}
            type="button"
            onClick={() => handleSelectSample(sample.name)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/50 hover:bg-muted px-2.5 py-1 text-xs font-mono text-foreground hover:border-primary/40 transition-colors"
          >
            <span>{sample.name}</span>
            <span className="text-[10px] text-muted-foreground font-sans">({sample.desc})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
