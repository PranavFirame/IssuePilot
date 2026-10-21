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
    <div className="w-full max-w-md mx-auto">
      {/* Brand Icon Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-sm hover:opacity-85 transition-opacity mb-4"
        >
          <Compass className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">{description}</p>
      </div>

      {/* Card Wrapper */}
      <div className="rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/20">
        {children}

        {footer && <div className="mt-6 pt-5 border-t border-border/60 text-center text-xs text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
