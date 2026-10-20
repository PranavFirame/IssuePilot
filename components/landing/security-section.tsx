import { Lock, EyeOff, ShieldCheck, DatabaseZap } from "lucide-react";

export function SecuritySection() {
  return (
    <section className="py-12 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 to-muted/20 p-8 sm:p-10 shadow-sm">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              <ShieldCheck className="h-4 w-4" />
              <span>Zero-Trust Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
              Security & Privacy by Default
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              IssuePilot is built exclusively with read-only principles. We never mutate
              your GitHub repositories, never store your credentials in browser storage, and isolate
              untrusted community issues from LLM prompt execution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-500" />
                <span>Read-Only Operations</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                No tokens with write access are ever required. The platform operates solely as an
                intelligence viewer.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <EyeOff className="h-4 w-4 text-indigo-500" />
                <span>Token Privacy</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Tokens are strictly handled server-side within API route handlers and are never leaked
                to client-side browser bundles.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-cyan-500" />
                <span>Prompt Isolation</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                All issue titles and markdown descriptions are wrapped in strict boundary delimiters
                to prevent prompt injection attacks.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <DatabaseZap className="h-4 w-4 text-amber-500" />
                <span>Zero-Crash AI Fallback</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                If no AI provider is configured, the entire repository analysis and duplicate detector
                continue functioning without error.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
