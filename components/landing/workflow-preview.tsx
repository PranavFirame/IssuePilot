import { Terminal, Layers, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    number: "1",
    icon: Terminal,
    title: "Ingest and sanitize",
    description:
      "Validate owner and repository identifiers against strict naming patterns. Fetch live metadata, open and closed issues, pull requests, and rate-limit headers.",
    color: "text-primary",
    borderColor: "border-primary/30",
    bgColor: "bg-primary/10",
  },
  {
    number: "2",
    icon: Layers,
    title: "Calculate intelligence",
    description:
      "Score repository health across four dimensions. Tokenize issues with TF-IDF vectorization to detect duplicate candidates and quantify staleness ratios.",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/10",
  },
  {
    number: "3",
    icon: CheckCircle2,
    title: "Triage and export",
    description:
      "Inspect issues with AI classification, prioritize backlog tickets, copy suggested labels, and export snapshots to CSV or Markdown reports.",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
  },
];

export function WorkflowPreview() {
  return (
    <section className="py-20 border-t border-border/40 bg-accent/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-foreground mb-3">
            How IssuePilot works
          </h2>
          <p className="text-[15px] text-muted-foreground max-w-[44ch] leading-relaxed">
            A transparent three-step pipeline converting raw repository backlogs into structured action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line on desktop */}
          <div className="hidden md:block absolute top-7 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px bg-border/60" aria-hidden="true" />

          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative flex flex-col gap-5 p-6 rounded-2xl border border-border/60 bg-background hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${step.borderColor} ${step.bgColor} ${step.color} text-xs font-bold font-mono shrink-0`}>
                    {step.number}
                  </div>
                  <Icon className={`h-5 w-5 ${step.color} opacity-60`} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2 tracking-[-0.01em]">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
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
