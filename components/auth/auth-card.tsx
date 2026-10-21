import * as React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Ambient background glow orbs */}
      <div
        className="hero-orb w-[420px] h-[420px] bg-indigo-600 top-[-80px] left-[-80px]"
        aria-hidden="true"
      />
      <div
        className="hero-orb w-[320px] h-[320px] bg-violet-600 bottom-[-50px] right-[-60px] opacity-[0.12]"
        aria-hidden="true"
      />

      <div className="relative">
        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 text-primary shadow-sm hover:opacity-85 transition-opacity mb-4 backdrop-blur-md"
          >
            <Compass className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">{description}</p>
        </div>

        {/* Card Wrapper */}
        <div className="glass-card p-6 sm:p-8 shadow-2xl">
          {children}

          {footer && <div className="mt-6 pt-5 border-t border-border/60 dark:border-white/10 text-center text-xs text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
