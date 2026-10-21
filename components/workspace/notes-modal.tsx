"use client";

import * as React from "react";
import { X, FileText, Check } from "lucide-react";
import { Button } from "../ui/button";

interface NotesModalProps {
  isOpen: boolean;
  issueTitle: string;
  issueNumber: number;
  initialNotes?: string | null;
  onClose: () => void;
  onSave: (notes: string) => void;
}

export function NotesModal({
  isOpen,
  issueTitle,
  issueNumber,
  initialNotes,
  onClose,
  onSave,
}: NotesModalProps) {
  const [notes, setNotes] = React.useState(initialNotes || "");
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    setNotes(initialNotes || "");
  }, [initialNotes, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(notes);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/60 dark:bg-background/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card relative w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-md shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 dark:border-white/10 px-4 sm:px-5 py-3.5 sm:py-4 bg-muted/30 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="p-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary backdrop-blur-md shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">
                Personal Notes #{issueNumber}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">{issueTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground block">
            Add context, reproduction insights, or implementation steps:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="e.g. Forked repo, reproducing bug in src/client.ts line 45. Planning PR tonight..."
            className="w-full rounded-xl border border-border/80 dark:border-white/10 bg-background/70 dark:bg-background/40 backdrop-blur-md p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all resize-none"
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 dark:border-white/10 px-4 sm:px-5 py-3 bg-muted/30 dark:bg-white/[0.02] flex items-center justify-end gap-2">
          <Button variant="glass" size="sm" onClick={onClose} className="text-xs h-8 px-3 flex-1 sm:flex-initial">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="text-xs h-8 gap-1.5 px-3 flex-1 sm:flex-initial">
            {isSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save Notes</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
