"use client";

import * as React from "react";
import { Check, CheckCircle2, Code2, Layers, Save, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserPreferencesData } from "@/lib/recommendations/matcher";

const AVAILABLE_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C++",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "HTML",
];

const AVAILABLE_TOPICS = [
  "web",
  "react",
  "next.js",
  "node",
  "cli",
  "devtools",
  "api",
  "ui",
  "algorithms",
  "security",
  "documentation",
];

export function PreferencesEditor() {
  const [preferences, setPreferences] = React.useState<UserPreferencesData>({
    languages: ["TypeScript", "JavaScript", "Python"],
    experienceLevel: "beginner",
    topics: ["web", "react", "tools"],
    monthlyGoal: 3,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/workspace/preferences");
        if (res.ok) {
          const data = await res.json();
          setPreferences({
            languages: data.languages || ["TypeScript", "JavaScript", "Python"],
            experienceLevel: data.experienceLevel || "beginner",
            topics: data.topics || ["web", "react", "tools"],
            monthlyGoal: data.monthlyGoal || 3,
          });
        }
      } catch {
        // Fallback to defaults
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const toggleLanguage = (lang: string) => {
    setPreferences((prev) => {
      const exists = prev.languages.includes(lang);
      const updated = exists ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang];
      return { ...prev, languages: updated.length ? updated : [lang] };
    });
  };

  const toggleTopic = (topic: string) => {
    setPreferences((prev) => {
      const exists = prev.topics.includes(topic);
      const updated = exists ? prev.topics.filter((t) => t !== topic) : [...prev.topics, topic];
      return { ...prev, topics: updated.length ? updated : [topic] };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/workspace/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        setSuccessMessage("Preferences saved. Your recommendations have been refreshed.");
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Experience Level */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Experience Level</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Calibrates which difficulty tiers receive the highest relevance scores in your feed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setPreferences((p) => ({ ...p, experienceLevel: lvl }))}
              className={`p-3 rounded-xl border text-left transition-all ${
                preferences.experienceLevel === lvl
                  ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                  : "border-border/80 bg-card/40 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold capitalize text-foreground">{lvl}</span>
                {preferences.experienceLevel === lvl && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {lvl === "beginner"
                  ? "Good first issues, starter docs, minor bugs"
                  : lvl === "intermediate"
                  ? "Feature additions, component refactors"
                  : "Architecture, deep performance, core engine"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Programming Languages */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Code2 className="h-3.5 w-3.5 text-cyan-400" />
          <span>Preferred Languages</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Select the programming languages you want highlighted in your issue recommendations.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isSelected = preferences.languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "border border-border/80 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
                <span>{lang}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Topics & Frameworks */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          <span>Focus Topics & Frameworks</span>
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {AVAILABLE_TOPICS.map((topic) => {
            const isSelected = preferences.topics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-semibold"
                    : "border border-border/80 bg-card/40 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                }`}
              >
                <span>#{topic}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly Contribution Goal */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-emerald-400" />
          <span>Monthly Contribution Goal</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Target number of merged PRs or completed starter issues per calendar month.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <input
            type="range"
            min={1}
            max={15}
            value={preferences.monthlyGoal}
            onChange={(e) =>
              setPreferences((p) => ({ ...p, monthlyGoal: parseInt(e.target.value, 10) }))
            }
            className="w-48 accent-primary cursor-pointer"
          />
          <span className="font-mono text-sm font-bold text-foreground">
            {preferences.monthlyGoal} {preferences.monthlyGoal === 1 ? "issue" : "issues"}/mo
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          isLoading={isSaving}
          className="h-10 px-5 text-xs font-semibold gap-2"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save Preferences</span>
        </Button>
      </div>
    </form>
  );
}
