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
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/85 backdrop-blur-xl transition-colors">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Compass className="h-4.5 w-4.5" style={{ width: "18px", height: "18px" }} />
            </div>
            <span className="text-[15px] font-bold tracking-[-0.02em]">IssuePilot</span>
          </Link>

          {/* Primary Navigation Links */}
          <nav className="hidden sm:flex items-center gap-0.5 text-sm font-medium">
            <Link
              href="/explore"
              className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Explore</span>
            </Link>
            <Link
              href="/"
              className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              Analyzer
            </Link>
            <Link
              href="/workspace"
              className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              Workspace
            </Link>
          </nav>

          {/* Quick inline search for desktop */}
          <form
            onSubmit={handleQuickSubmit}
            className="hidden md:flex items-center relative w-56 lg:w-72"
          >
            <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="owner/repo"
              className="w-full rounded-lg border border-border bg-accent/40 pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
            {quickInput && (
              <button
                type="submit"
                aria-label="Navigate to repo"
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {onOpenSavedReports && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSavedReports}
              className="gap-1.5 text-sm h-9 border-border/80"
            >
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Saved</span>
            </Button>
          )}

          {/* Theme switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(actualTheme === "dark" ? "light" : "dark")}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {actualTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* GitHub Source Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
