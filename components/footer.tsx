import Link from "next/link";
import { Compass, ShieldCheck, Cpu, Database } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/60 bg-background/50 py-10 transition-colors text-xs text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Compass className="h-4 w-4 text-primary" />
            <span>IssuePilot</span>
          </div>
          <span className="hidden sm:inline text-muted-foreground/40">•</span>
          <p>AI-Powered GitHub Issue Triage and Repository Intelligence Platform</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>SSRF Protected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-indigo-500" />
            <span>Zero-Crash AI Degradation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-cyan-500" />
            <span>Prisma Persistence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
