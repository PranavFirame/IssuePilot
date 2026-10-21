"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Compass,
  Github,
  Search,
  History,
  Sparkles,
  ArrowRight,
  User as UserIcon,
  LogOut,
  Sliders,
  LayoutDashboard,
  ChevronDown,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "./auth/auth-provider";
import { Button } from "./ui/button";

interface NavbarProps {
  onOpenSavedReports?: () => void;
}

export function Navbar({ onOpenSavedReports }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [quickInput, setQuickInput] = React.useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
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
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-2xl transition-colors shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-85"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/15 text-primary shadow-sm backdrop-blur-md">
              <Compass className="h-4.5 w-4.5" style={{ width: "18px", height: "18px" }} />
            </div>
            <span className="text-[15px] font-bold tracking-[-0.02em]">IssuePilot</span>
          </Link>

          {/* Primary Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/explore"
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Explore</span>
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            >
              Analyzer
            </Link>
            <Link
              href="/workspace"
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
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
              className="w-full rounded-lg border border-border/80 bg-accent/30 backdrop-blur-md pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
            {quickInput && (
              <button
                type="submit"
                aria-label="Navigate to repo"
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="sm"
            onClick={onOpenSavedReports || (() => router.push("/workspace?view=analyzed"))}
            className="gap-1.5 text-xs sm:text-sm h-9 hidden sm:inline-flex"
            title="View saved and analyzed repositories"
          >
            <History className="h-3.5 w-3.5" />
            <span>Saved</span>
          </Button>

          {/* User Profile / Auth State */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 sm:pr-2.5 rounded-lg border border-border/80 bg-accent/30 backdrop-blur-md hover:bg-accent/60 transition-colors text-xs font-medium cursor-pointer min-h-[36px]"
                aria-expanded={isUserMenuOpen}
                aria-label="User account menu"
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

              {/* User Dropdown Menu - 100% Solid Non-Transparent on all routes */}
              {isUserMenuOpen && (
                <div className="!absolute top-full right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] p-2 shadow-2xl text-xs space-y-1 z-50 animate-in fade-in zoom-in-95 rounded-2xl border border-border bg-white text-foreground shadow-[0_16px_48px_rgba(0,0,0,0.14)]">
                  <div className="px-2.5 py-2 border-b border-border/80">
                    <p className="font-semibold text-foreground truncate">{user.name || "Contributor"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    {user.githubUsername && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary font-mono">
                        <Github className="h-3 w-3" />
                        <span>@{user.githubUsername}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/workspace"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent/80 transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                    <span>Personal Dashboard</span>
                  </Link>

                  <Link
                    href="/workspace?view=analyzed"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent/80 transition-colors"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Analyzed Repositories</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent/80 transition-colors"
                  >
                    <Sliders className="h-3.5 w-3.5 text-cyan-600" />
                    <span>Profile &amp; Preferences</span>
                  </Link>

                  <div className="border-t border-border/80 my-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
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
                className="text-xs sm:text-sm h-9 px-2.5 sm:px-3"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/auth/signup")}
                className="text-xs sm:text-sm h-9 px-3 sm:px-3.5 font-semibold shadow-sm"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setIsUserMenuOpen(false);
            }}
            className="sm:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-border/80 bg-white px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          {/* Authenticated user header card on mobile */}
          {isAuthenticated && user && (
            <div className="rounded-xl border border-border/80 bg-white p-3 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.avatarUrl ? (
                  <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-primary/20 shrink-0">
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || user.email}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold shrink-0">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user.name || "Contributor"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="shrink-0 text-destructive hover:bg-destructive/10 p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Exit</span>
              </button>
            </div>
          )}

          {/* Quick inline search for mobile */}
          <form
            onSubmit={(e) => {
              handleQuickSubmit(e);
              setIsMobileMenuOpen(false);
            }}
            className="relative w-full"
          >
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Analyze owner/repo..."
              className="w-full rounded-xl border border-border/80 dark:border-white/10 bg-accent/30 dark:bg-white/5 backdrop-blur-md pl-9 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background/90 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            {quickInput && (
              <button
                type="submit"
                aria-label="Navigate to repo"
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer p-0.5"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col space-y-1">
            <Link
              href="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/60 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Explore Beginner Issues</span>
            </Link>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/60 transition-colors"
            >
              <Compass className="h-4 w-4 text-primary" />
              <span>Repository Analyzer</span>
            </Link>
            <Link
              href="/workspace"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/60 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-primary" />
              <span>Contributor Workspace</span>
            </Link>
            {isAuthenticated && (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/60 transition-colors"
              >
                <Sliders className="h-4 w-4 text-cyan-500" />
                <span>Profile &amp; Preferences</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onOpenSavedReports) {
                  onOpenSavedReports();
                } else {
                  router.push("/workspace?view=analyzed");
                }
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/60 transition-colors w-full text-left cursor-pointer"
            >
              <History className="h-4 w-4 text-primary" />
              <span>Saved Snapshots &amp; Repositories</span>
            </button>
          </nav>

          {/* Unauthenticated buttons in mobile drawer */}
          {!isAuthenticated && (
            <div className="pt-2 border-t border-border/80 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/auth/signin");
                }}
                className="flex-1 text-xs h-9"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/auth/signup");
                }}
                className="flex-1 text-xs h-9 font-semibold"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
