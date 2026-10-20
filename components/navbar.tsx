"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Github,
  Moon,
  Search,
  Sun,
  History,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";

interface NavbarProps {
  onOpenSavedReports?: () => void;
}

export function Navbar({ onOpenSavedReports }: NavbarProps) {
  const { actualTheme, setTheme } = useTheme();
  const [quickInput, setQuickInput] = React.useState("");
  const router = useRouter();

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickInput.trim();
    if (!trimmed) return;

    if (trimmed.includes("/")) {
      const parts = trimmed.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const owner = parts[parts.length - 2].replace(/.*github\.com[\/:]/i, "");
        const repo = parts[parts.length - 1].replace(/\.git$/i, "");
        router.push(`/repo/${owner}/${repo}`);
        setQuickInput("");
        return;
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight">IssuePilot</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                v1.0
              </span>
            </div>
          </Link>

          {/* Primary Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1 text-xs font-medium">
            <Link
              href="/explore"
              className="px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Explore Issues</span>
            </Link>
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Analyzer
            </Link>
            <Link
              href="/workspace"
              className="px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              My Workspace
            </Link>
          </nav>

          {/* Quick inline search for desktop */}
          <form
            onSubmit={handleQuickSubmit}
            className="hidden md:flex items-center relative w-64 lg:w-80"
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Jump to repo (e.g. owner/repo)..."
              className="w-full rounded-md border border-border bg-muted/40 pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none transition-all"
            />
            {quickInput && (
              <button
                type="submit"
                aria-label="Navigate to repo"
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onOpenSavedReports && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSavedReports}
              className="gap-1.5 text-xs h-8"
            >
              <History className="h-3.5 w-3.5" />
              <span>Saved Snapshots</span>
            </Button>
          )}

          {/* Theme switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(actualTheme === "dark" ? "light" : "dark")}
            className="h-8 w-8"
            aria-label="Toggle theme"
          >
            {actualTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </Button>

          {/* GitHub Source Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="GitHub API"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
