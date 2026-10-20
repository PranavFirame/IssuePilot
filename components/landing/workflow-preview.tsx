import { GitPullRequest, Search, CheckCircle, Terminal, Layers } from "lucide-react";

export function WorkflowPreview() {
  return (
    <section className="py-12 border-t border-border/40 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            How IssuePilot Works
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            A transparent 3-step pipeline converting raw repository backlogs into structured
            engineering action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="flex flex-col items-start p-6 rounded-xl border border-border bg-card/50">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                STEP 01
              </span>
              <Terminal className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-2">Ingest & Sanitize</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Validate owner and repository identifiers against strict naming patterns. Fetch
              live repository metadata, open and closed issues, pull requests, and rate-limit headers.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-start p-6 rounded-xl border border-border bg-card/50">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500">
                STEP 02
              </span>
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-2">Calculate Intelligence</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Score repository health across 4 dimensions. Tokenize issues with TF-IDF vectorization
              to detect duplicate issue candidates and quantify staleness ratios.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-start p-6 rounded-xl border border-border bg-card/50">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                STEP 03
              </span>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-2">Triage & Export</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Inspect issues with AI classification, prioritize backlog tickets, copy suggested labels,
              and export snapshots to CSV or Markdown reports.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
