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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
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
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground block">
            Add context, reproduction insights, or implementation steps:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="e.g. Forked repo, reproducing bug in src/client.ts line 45. Planning PR tonight..."
            className="w-full rounded-md border border-border bg-background p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="text-xs gap-1.5">
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
