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
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search beginner issues (e.g., react, cli, parser, docs)..."
            className="w-full rounded-md border border-border bg-background/60 pl-9 pr-20 py-1.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            aria-label="Search beginner issues"
          />
          {searchInput !== query && (
            <button
              type="submit"
              className="absolute right-2 top-1.5 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold"
            >
              Search
            </button>
          )}
        </form>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <select
            value={language || "all"}
            onChange={(e) => onFilterChange({ language: e.target.value })}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
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
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
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
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            aria-label="Sort order"
          >
            <option value="updated">Recently Updated</option>
            <option value="comments">Most Comments</option>
            <option value="created">Newest Created</option>
          </select>

          {/* Reset Filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
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
              className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Sparkles className="h-3 w-3" />
              <span>My Preferences</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
