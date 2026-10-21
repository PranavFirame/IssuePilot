"use client";

import * as React from "react";
import { X, Sparkles, Check, ArrowRight, Target, Code2, BookOpen } from "lucide-react";
import { UserPreferencesData } from "@/lib/recommendations/matcher";
import { saveUserPreferences } from "@/lib/workspace/storage";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: UserPreferencesData;
  onSavePreferences: (updated: UserPreferencesData) => void;
}

const AVAILABLE_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C++",
  "PHP",
  "Ruby",
];

const AVAILABLE_TOPICS = [
  "web",
  "react",
  "next.js",
  "node",
  "cli",
  "tools",
  "docs",
  "testing",
  "bugfix",
];

export function OnboardingModal({
  isOpen,
  onClose,
  currentPreferences,
  onSavePreferences,
}: OnboardingModalProps) {
  const [languages, setLanguages] = React.useState<string[]>(currentPreferences.languages || ["TypeScript", "JavaScript"]);
  const [experienceLevel, setExperienceLevel] = React.useState<"beginner" | "intermediate" | "advanced">(
    currentPreferences.experienceLevel || "beginner"
  );
  const [topics, setTopics] = React.useState<string[]>(currentPreferences.topics || ["web", "react", "tools"]);
  const [monthlyGoal, setMonthlyGoal] = React.useState<number>(currentPreferences.monthlyGoal || 3);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLanguages(currentPreferences.languages || ["TypeScript", "JavaScript"]);
      setExperienceLevel(currentPreferences.experienceLevel || "beginner");
      setTopics(currentPreferences.topics || ["web", "react", "tools"]);
      setMonthlyGoal(currentPreferences.monthlyGoal || 3);
    }
  }, [isOpen, currentPreferences]);

  if (!isOpen) return null;

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? (prev.length > 1 ? prev.filter((l) => l !== lang) : prev) : [...prev, lang]
    );
  };

  const toggleTopic = (topic: string) => {
    setTopics((prev) =>
      prev.includes(topic) ? (prev.length > 1 ? prev.filter((t) => t !== topic) : prev) : [...prev, topic]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updated: UserPreferencesData = {
      languages,
      experienceLevel,
      topics,
      monthlyGoal,
    };

    try {
      await saveUserPreferences(updated);
      onSavePreferences(updated);
      onClose();
    } catch {
      // Fallback
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/60 dark:bg-background/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card relative w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-xl p-4 sm:p-7 shadow-2xl flex flex-col max-h-[90dvh] overflow-y-auto space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personalized Matching Engine</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Calibrate Your Contributor Preferences
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select your languages, experience level, and interests to receive transparently scored GitHub issue recommendations.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1. Languages */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            <span>Preferred Programming Languages (Select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_LANGUAGES.map((lang) => {
              const isSelected = languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border min-h-[32px] ${
                    isSelected
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/80 bg-accent/20 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  <span>{lang}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Experience Level */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span>Experience Level</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { level: "beginner" as const, label: "Beginner", desc: "Good first issues & docs" },
              { level: "intermediate" as const, label: "Intermediate", desc: "Help wanted & features" },
              { level: "advanced" as const, label: "Advanced", desc: "Complex architecture & core" },
            ].map((item) => {
              const isSelected = experienceLevel === item.level;
              return (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setExperienceLevel(item.level)}
                  className={`p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/70 bg-card hover:border-border"
                  }`}
                >
                  <p className={`text-xs font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Focus Topics & Interests */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Focus Topics &amp; Interests</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_TOPICS.map((topic) => {
              const isSelected = topics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all border min-h-[30px] ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold"
                      : "border-border/60 bg-accent/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  #{topic}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Monthly Contribution Goal */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-emerald-400" />
            <span>Monthly Contribution Target</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 3, 5, 10].map((goal) => {
              const isSelected = monthlyGoal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setMonthlyGoal(goal)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all text-center min-h-[38px] ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                      : "border-border/70 bg-accent/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {goal} {goal === 1 ? "issue" : "issues"} / mo
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-border/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-muted-foreground h-9">
            Skip for now
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="text-xs gap-1.5 font-semibold px-4 h-9"
          >
            <span>Save &amp; Recalibrate</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
