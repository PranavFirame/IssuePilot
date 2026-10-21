import {
  Activity,
  CopyCheck,
  BrainCircuit,
  FileSpreadsheet,
  Gauge,
  ShieldAlert,
  Sparkles,
  BookmarkCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Beginner Issue Discovery",
    description:
      "Curates accessible starter tickets tagged good first issue and help wanted across GitHub, with explainable language and skill relevance scoring.",
    accent: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    icon: BookmarkCheck,
    title: "Personal Contributor Workspace",
    description:
      "Track issues as Saved, Interested, In Progress, or Completed. Add implementation notes, set monthly contribution goals, and attach verified pull requests.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Gauge,
    title: "Repository Health Scoring",
    description:
      "Calculates multi-dimensional maintenance health grades (A+ through F) based on push velocity, issue closure ratios, stale backlog volume, and PR turnover.",
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: CopyCheck,
    title: "Duplicate Issue Radar",
    description:
      "Automated TF-IDF and weighted token cosine similarity scans titles and descriptions to uncover related or duplicate tickets before engineers duplicate work.",
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: BrainCircuit,
    title: "AI Backlog Triage",
    description:
      "Classify issues into bugs, features, or questions with recommended priority, clear reasoning, missing information checklists, and suggested labels.",
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: ShieldAlert,
    title: "Security by Default",
    description:
      "Domain-validated GitHub API routes with sanitized inputs. Issue content is treated as untrusted data with strict XML-fenced boundaries for AI models.",
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-20 border-t border-border/60 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-foreground mb-3">
            Engineered for maintainers and teams
          </h2>
          <p className="text-[15px] text-muted-foreground max-w-[48ch] leading-relaxed">
            Clear signals, reproducible metrics, and actionable recommendations — no invented data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="glass-card-interactive p-7 space-y-4 group"
              >
                <div className={`inline-flex p-3 rounded-xl border border-border/60 dark:border-white/10 backdrop-blur-md ${f.bg} ${f.accent} group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-foreground mb-2 tracking-[-0.01em] group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
