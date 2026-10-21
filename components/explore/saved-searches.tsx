"use client";

import * as React from "react";
import {
  Bookmark,
  Plus,
  Trash2,
  Search,
  X,
  BookmarkCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  language: string;
  difficulty: string;
  sort: string;
  createdAt: string;
}

interface SavedSearchesProps {
  /** Current active filters — used to pre-fill the save form */
  currentFilters: {
    query: string;
    language: string;
    difficulty: string;
    sort: string;
  };
  /** Called when the user clicks "Apply" on a saved search */
  onApply: (filters: { query: string; language: string; difficulty: string; sort: string }) => void;
}

export function SavedSearches({ currentFilters, onApply }: SavedSearchesProps) {
  const [searches, setSearches] = React.useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveName, setSaveName] = React.useState("");
  const [showSaveForm, setShowSaveForm] = React.useState(false);

  const loadSearches = React.useCallback(async () => {
    try {
      const res = await fetch("/api/saved-searches");
      if (res.ok) {
        const data = await res.json();
        setSearches(data.searches || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) loadSearches();
  }, [isOpen, loadSearches]);

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...currentFilters }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Failed to save search.");
        return;
      }
      setSearches((prev) => [data.search, ...prev]);
      setSaveName("");
      setShowSaveForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
  };

  const hasActiveFilters =
    currentFilters.query ||
    (currentFilters.language && currentFilters.language !== "all") ||
    (currentFilters.difficulty && currentFilters.difficulty !== "all") ||
    currentFilters.sort !== "updated";

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((o) => !o)}
        className="h-8 text-xs gap-1.5 border-border/80"
        aria-label="Saved searches"
        aria-expanded={isOpen}
      >
        <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
        <span className="hidden sm:inline">Saved</span>
        {searches.length > 0 && (
          <span className="ml-0.5 font-mono text-[10px] text-muted-foreground">
            {searches.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown panel */}
          <div className="!absolute right-0 top-10 z-40 w-72 max-w-[calc(100vw-2rem)] p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-100 rounded-xl border border-border bg-white text-foreground shadow-[0_16px_48px_rgba(0,0,0,0.14)]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5 text-primary" />
                Saved Searches
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close saved searches"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Save current filters */}
            {hasActiveFilters && !showSaveForm && (
              <div className="px-3 py-2 border-b border-border/40">
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Save current filters
                </button>
              </div>
            )}

            {showSaveForm && (
              <div className="px-3 py-2.5 border-b border-border/40 space-y-2">
                <p className="text-[11px] text-muted-foreground font-medium">Name this search</p>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="e.g. TypeScript docs issues"
                  autoFocus
                  maxLength={80}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
                  aria-label="Search name"
                />
                {saveError && (
                  <p className="text-[11px] text-destructive">{saveError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !saveName.trim()}
                    className="h-7 text-[11px] flex-1 gap-1"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Bookmark className="h-3 w-3" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowSaveForm(false); setSaveError(null); }}
                    className="h-7 text-[11px]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Saved searches list */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : searches.length === 0 ? (
                <div className="py-6 px-3 text-center">
                  <Search className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[11px] text-muted-foreground">
                    No saved searches yet.
                    <br />
                    Apply filters and save them here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {searches.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 px-3 py-2 hover:bg-accent/30 transition-colors">
                      <button
                        onClick={() => {
                          onApply({
                            query: s.query,
                            language: s.language,
                            difficulty: s.difficulty,
                            sort: s.sort,
                          });
                          setIsOpen(false);
                        }}
                        className="flex-1 text-left min-w-0"
                        title={`Apply: ${s.name}`}
                      >
                        <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {[
                            s.query && `"${s.query}"`,
                            s.language !== "all" && s.language,
                            s.difficulty !== "all" && s.difficulty,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "All beginner issues"}
                        </p>
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                        aria-label={`Delete saved search: ${s.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
