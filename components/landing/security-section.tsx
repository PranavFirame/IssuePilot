import { Lock, EyeOff, ShieldCheck, DatabaseZap } from "lucide-react";

const SECURITY_ITEMS = [
  {
    icon: Lock,
    title: "Read-only operations",
    description:
      "No tokens with write access are ever required. The platform operates solely as an intelligence viewer.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: EyeOff,
    title: "Token privacy",
    description:
      "Tokens are strictly handled server-side within API route handlers and are never leaked to client-side browser bundles.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Prompt isolation",
    description:
      "All issue titles and markdown descriptions are wrapped in strict boundary delimiters to prevent prompt injection attacks.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: DatabaseZap,
    title: "Zero-crash AI fallback",
    description:
      "If no AI provider is configured, the entire repository analysis and duplicate detector continue functioning without error.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

export function SecuritySection() {
  return (
    <section className="py-20 border-t border-border/60 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="glass-card p-8 sm:p-12">
          <div className="mb-10">
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Zero-trust architecture
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-foreground mb-3">
              Security and privacy by default
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[52ch]">
              IssuePilot is built exclusively with read-only principles. We never mutate your GitHub repositories, never store credentials in browser storage, and isolate untrusted community issues from LLM prompt execution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SECURITY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-4 rounded-xl border border-border/60 dark:border-white/5 bg-background/50 dark:bg-white/[0.02] backdrop-blur-md space-y-3 hover:border-primary/40 transition-colors">
                  <div className={`inline-flex p-2.5 rounded-lg border border-border/50 dark:border-white/10 backdrop-blur-md ${item.bg} ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
