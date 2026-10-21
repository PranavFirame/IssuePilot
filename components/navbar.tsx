"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
  User as UserIcon,
  LogOut,
  Sliders,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "./auth/auth-provider";
import { Button } from "./ui/button";

interface NavbarProps {
  onOpenSavedReports?: () => void;
}

export function Navbar({ onOpenSavedReports }: NavbarProps) {
  const { actualTheme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [quickInput, setQuickInput] = React.useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="flex items-center gap-2">
          {onOpenSavedReports && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSavedReports}
              className="gap-1.5 text-xs sm:text-sm h-9 border-border/80 hidden sm:inline-flex"
            >
              <History className="h-3.5 w-3.5" />
              <span>Saved</span>
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
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User Profile / Auth State */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border border-border/80 bg-accent/30 hover:bg-accent/60 transition-colors text-xs font-medium"
                aria-expanded={isUserMenuOpen}
              >
                {user.avatarUrl ? (
                  <div className="relative h-6 w-6 rounded-md overflow-hidden bg-primary/20 shrink-0">
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || user.email}
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary text-[11px] font-bold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[120px] truncate text-foreground">
                  {user.name || user.email.split("@")[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl text-xs space-y-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-2 border-b border-border/60">
                    <p className="font-semibold text-foreground truncate">{user.name || "Contributor"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    {user.githubUsername && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary">
                        <Github className="h-3 w-3" />
                        <span>@{user.githubUsername}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/workspace"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent/60 transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                    <span>Personal Dashboard</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent/60 transition-colors"
                  >
                    <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Profile & Preferences</span>
                  </Link>

                  <div className="border-t border-border/60 my-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/auth/signin")}
                className="text-xs sm:text-sm h-9 px-3"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/auth/signup")}
                className="text-xs sm:text-sm h-9 px-3.5 font-semibold"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
