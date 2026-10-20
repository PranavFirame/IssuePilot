"use client";

import * as React from "react";
import { X, GitPullRequest, Check, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface LinkPrModalProps {
  isOpen: boolean;
  issueTitle: string;
  issueNumber: number;
  initialPrUrl?: string | null;
  onClose: () => void;
  onSave: (prUrl: string) => void;
}

const GITHUB_PR_REGEX = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/i;

export function LinkPrModal({
  isOpen,
  issueTitle,
  issueNumber,
  initialPrUrl,
  onClose,
  onSave,
}: LinkPrModalProps) {
  const [prUrl, setPrUrl] = React.useState(initialPrUrl || "");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPrUrl(initialPrUrl || "");
    setError(null);
  }, [initialPrUrl, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = prUrl.trim();
    if (trimmed && !GITHUB_PR_REGEX.test(trimmed)) {
      setError("Please enter a valid GitHub pull request URL (e.g. https://github.com/owner/repo/pull/123).");
      return;
    }

    onSave(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <GitPullRequest className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">
                Link Completed Pull Request
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">
                #{issueNumber} • {issueTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground block">
            GitHub Pull Request URL:
          </label>
          <input
            type="url"
            value={prUrl}
            onChange={(e) => {
              setPrUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://github.com/owner/repo/pull/123"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            autoFocus
          />

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
            Linking your PR verifies your contribution in your local tracker. Completed issues with a
            valid pull request URL receive the <strong>Verified PR</strong> badge.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="text-xs">
            Link Pull Request
          </Button>
        </div>
      </div>
    </div>
  );
}
