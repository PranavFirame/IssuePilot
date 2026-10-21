"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, KeyRound } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [devToken, setDevToken] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setIsSubmitted(true);
      if (data.resetToken && data.resetToken !== "test_token_stub") {
        setDevToken(data.resetToken);
      }
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 bg-background">
      <AuthCard
        title="Reset your password"
        description="Enter your registered email address and we'll generate password reset instructions."
        footer={
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to sign in</span>
          </Link>
        }
      >
        {isSubmitted ? (
          <div className="space-y-5 text-center py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Check your inbox</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                If an account exists for <span className="font-semibold text-foreground">{email}</span>, password reset instructions have been generated.
              </p>
            </div>

            {/* Development helper banner when live SMTP server is not set */}
            {devToken && (
              <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/10 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Development Reset Token</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Since live SMTP credentials are not configured, you can test the reset workflow directly:
                </p>
                <Link
                  href={`/auth/reset-password?token=${encodeURIComponent(devToken)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Complete Password Reset</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full rounded-lg border border-border bg-accent/40 pl-9 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full h-11 font-semibold text-sm gap-2 mt-2"
            >
              <span>Send Reset Instructions</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}
      </AuthCard>
    </div>
  );
}
