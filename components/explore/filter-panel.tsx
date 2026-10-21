"use client";

import * as React from "react";
import { Search, SlidersHorizontal, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { SavedSearches } from "./saved-searches";

interface FilterPanelProps {
  query: string;
  language: string;
  difficulty: string;
  sort: string;
  onFilterChange: (filters: {
    query?: string;
    language?: string;
    difficulty?: string;
    sort?: string;
  }) => void;
  onResetFilters: () => void;
  onOpenPreferences?: () => void;
  /** Called when user applies a saved search — replaces all active filters */
  onApplySavedSearch?: (filters: { query: string; language: string; difficulty: string; sort: string }) => void;
}

const LANGUAGES = [
  "All",
  "TypeScript",
  "JavaScript",
  "Python",
  "Rust",
  "Go",
  "Java",
  "C++",
  "C#",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
];

const DIFFICULTIES = [
  { value: "all", label: "All Beginner Labels" },
  { value: "good first issue", label: "Good First Issue" },
  { value: "help wanted", label: "Help Wanted" },
  { value: "documentation", label: "Documentation" },
  { value: "beginner", label: "Beginner Friendly" },
];

export function FilterPanel({
  query,
  language,
  difficulty,
  sort,
  onFilterChange,
  onResetFilters,
  onOpenPreferences,
  onApplySavedSearch,
}: FilterPanelProps) {
  const [searchInput, setSearchInput] = React.useState(query);

  React.useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Debounce: fire onFilterChange 600ms after user stops typing
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange({ query: value });
    }, 600);
  };

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onFilterChange({ query: searchInput });
  };

  const isFiltered = query || (language && language !== "all") || (difficulty && difficulty !== "all") || sort !== "updated";

  return (
    <div className="glass-card p-4 sm:p-5 space-y-3 shadow-sm relative">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search beginner issues (e.g., react, cli, parser, docs)..."
            className="w-full rounded-xl border border-border/80 dark:border-white/10 bg-background/70 dark:bg-card/60 backdrop-blur-md pl-10 pr-20 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            aria-label="Search beginner issues"
          />
          {searchInput !== query && (
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer shadow-sm hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          )}
        </form>

        {/* Dropdown Filters and Action Controls */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
          {/* Select Controls Grid for Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-2 w-full lg:w-auto">
            {/* Language Selector */}
            <select
              value={language || "all"}
              onChange={(e) => onFilterChange({ language: e.target.value })}
              className="h-9 sm:h-9 rounded-xl border border-border/80 dark:border-white/10 bg-background/80 dark:bg-card/80 backdrop-blur-md px-3 text-xs text-foreground focus:border-primary/60 focus:outline-none cursor-pointer w-full lg:w-auto"
              aria-label="Filter by programming language"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l.toLowerCase() === "all" ? "all" : l}>
                  Language: {l}
                </option>
              ))}
            </select>

            {/* Difficulty Selector */}
            <select
              value={difficulty || "all"}
              onChange={(e) => onFilterChange({ difficulty: e.target.value })}
              className="h-9 sm:h-9 rounded-xl border border-border/80 dark:border-white/10 bg-background/80 dark:bg-card/80 backdrop-blur-md px-3 text-xs text-foreground focus:border-primary/60 focus:outline-none cursor-pointer w-full lg:w-auto"
              aria-label="Filter by difficulty"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sort || "updated"}
              onChange={(e) => onFilterChange({ sort: e.target.value })}
              className="h-9 sm:h-9 rounded-xl border border-border/80 dark:border-white/10 bg-background/80 dark:bg-card/80 backdrop-blur-md px-3 text-xs text-foreground focus:border-primary/60 focus:outline-none cursor-pointer w-full lg:w-auto"
              aria-label="Sort order"
            >
              <option value="updated">Recently Updated</option>
              <option value="comments">Most Comments</option>
              <option value="created">Newest Created</option>
            </select>
          </div>

          {/* Action pills row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            {/* Reset Filters */}
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="h-9 sm:h-8 text-xs text-muted-foreground hover:text-foreground gap-1 flex-1 sm:flex-none justify-center"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </Button>
            )}

            {/* Saved Searches Dropdown */}
            {onApplySavedSearch && (
              <SavedSearches
                currentFilters={{ query, language, difficulty, sort }}
                onApply={onApplySavedSearch}
              />
            )}

            {/* Preferences Button */}
            {onOpenPreferences && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenPreferences}
                className="h-9 sm:h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5 flex-1 sm:flex-none justify-center"
              >
                <Sparkles className="h-3 w-3" />
                <span>Preferences</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
