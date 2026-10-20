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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Beginner Issue Discovery",
    description:
      "Curates accessible starter tickets tagged 'good first issue', 'help wanted', and 'documentation' across GitHub with explainable language and skill relevance scoring.",
    badge: "Open Source Radar",
    color: "text-indigo-400",
  },
  {
    icon: BookmarkCheck,
    title: "Personal Contributor Workspace",
    description:
      "Track issues as Saved, Interested, In Progress, or Completed. Add implementation notes, set monthly contribution goals, and attach verified pull requests.",
    badge: "Local-First Sync",
    color: "text-emerald-400",
  },
  {
    icon: Gauge,
    title: "Repository Health Scoring",
    description:
      "Calculates multi-dimensional maintenance health grades (A+ through F) based on push velocity, issue closure ratios, stale backlog volume, and PR turnover.",
    badge: "Deterministic",
    color: "text-blue-500",
  },
  {
    icon: CopyCheck,
    title: "Duplicate Issue Radar",
    description:
      "Automated TF-IDF and weighted token cosine similarity scans titles and descriptions to uncover related or duplicate tickets before engineers duplicate work.",
    badge: "NLP Vectorization",
    color: "text-cyan-500",
  },
  {
    icon: BrainCircuit,
    title: "AI Backlog Triage",
    description:
      "Classify issues into bugs, features, or questions with recommended priority, clear reasoning, missing information checklists, and suggested labels.",
    badge: "Optional / Fallback Safe",
    color: "text-purple-400",
  },
  {
    icon: ShieldAlert,
    title: "SSRF & Injection Defense",
    description:
      "Domain-validated GitHub API routes with sanitized inputs. Issue content is treated as untrusted data with strict XML-fenced boundaries for AI models.",
    badge: "Security Hardened",
    color: "text-rose-500",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-12 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            Engineered for Maintainers & Teams
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Clear signals, reproducible metrics, and actionable recommendations without
            bloat or fake numbers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card
                key={i}
                className="bg-card/60 backdrop-blur border-border/80 hover:border-primary/40 transition-colors shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg bg-muted/60 ${f.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {f.badge}
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed">
                    {f.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
