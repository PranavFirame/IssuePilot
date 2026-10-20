import Link from "next/link";
import { Compass, ShieldCheck, Cpu, Database } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 py-10 transition-colors">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand + description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold tracking-[-0.01em] text-foreground">IssuePilot</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-[36ch] leading-relaxed">
              AI-powered GitHub issue triage and repository intelligence for open-source teams.
            </p>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>SSRF protected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span>Zero-crash AI degradation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Prisma persistence</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground/60">
          <p>Built with Next.js, Tailwind CSS, and the GitHub REST API.</p>
          <p>Read-only — your repositories are never modified.</p>
        </div>
      </div>
    </footer>
  );
}
