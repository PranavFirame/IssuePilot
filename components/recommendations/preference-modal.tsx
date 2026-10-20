"use client";

import * as React from "react";
import { X, Sparkles, Check, CheckCircle2 } from "lucide-react";
import { UserPreferencesData } from "@/lib/recommendations/matcher";
import { Button } from "../ui/button";

interface PreferenceModalProps {
  isOpen: boolean;
  preferences: UserPreferencesData;
  onClose: () => void;
  onSave: (prefs: UserPreferencesData) => void;
}

const AVAILABLE_LANGS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Rust",
  "Go",
  "Java",
  "C++",
  "C#",
  "Ruby",
  "Swift",
  "Kotlin",
];

const AVAILABLE_TOPICS = [
  "web",
  "react",
  "cli",
  "ai",
  "tools",
  "database",
  "api",
  "security",
  "docs",
  "testing",
];

export function PreferenceModal({
  isOpen,
  preferences,
  onClose,
  onSave,
}: PreferenceModalProps) {
  const [selectedLangs, setSelectedLangs] = React.useState<string[]>(preferences.languages || []);
  const [experienceLevel, setExperienceLevel] = React.useState<"beginner" | "intermediate" | "advanced">(
    preferences.experienceLevel || "beginner"
  );
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>(preferences.topics || []);
  const [monthlyGoal, setMonthlyGoal] = React.useState<number>(preferences.monthlyGoal || 3);
  const [isSavedNotice, setIsSavedNotice] = React.useState(false);

  React.useEffect(() => {
    setSelectedLangs(preferences.languages || []);
    setExperienceLevel(preferences.experienceLevel || "beginner");
    setSelectedTopics(preferences.topics || []);
    setMonthlyGoal(preferences.monthlyGoal || 3);
  }, [preferences, isOpen]);

  if (!isOpen) return null;

  const toggleLanguage = (lang: string) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSave = () => {
    onSave({
      languages: selectedLangs,
      experienceLevel,
      topics: selectedTopics,
      monthlyGoal,
    });
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Recommendation Preferences</h3>
              <p className="text-[11px] text-muted-foreground">
                Tune your skill profile to power transparent relevance scoring
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
        <div className="overflow-y-auto p-6 space-y-5 flex-1 text-xs sm:text-sm">
          {/* Languages */}
          <div className="space-y-2">
            <span className="font-semibold text-foreground block">
              Preferred Programming Languages
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_LANGS.map((lang) => {
                const isSelected = selectedLangs.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <span className="font-semibold text-foreground block">Your Open Source Experience</span>
            <div className="grid grid-cols-3 gap-2">
              {(["beginner", "intermediate", "advanced"] as const).map((lvl) => {
                const isSelected = experienceLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperienceLevel(lvl)}
                    className={`p-2.5 rounded-lg border text-xs capitalize transition-all text-center ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                        : "border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topics of Interest */}
          <div className="space-y-2">
            <span className="font-semibold text-foreground block">Domains & Topics</span>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-semibold"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    #{topic}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Contribution Goal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Monthly Contribution Target</span>
              <span className="font-mono text-primary font-bold">{monthlyGoal} contributions</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Saved to local workspace profile
          </span>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="text-xs gap-1.5">
              {isSavedNotice ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
