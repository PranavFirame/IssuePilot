"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Lock, Mail, User, ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { GithubButton } from "@/components/auth/github-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const returnUrl = searchParams.get("redirect") || searchParams.get("returnUrl") || "/workspace";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account. Please try again.");
        return;
      }

      await refreshUser();
      router.push(returnUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      description="Join IssuePilot to personalize recommendations, track open-source contributions, and manage your backlog."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href={`/auth/signin?redirect=${encodeURIComponent(returnUrl)}`}
            className="text-primary hover:underline font-semibold"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        {/* GitHub OAuth Button */}
        <GithubButton returnUrl={returnUrl} />

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <span className="relative bg-card px-3 text-[11px] text-muted-foreground uppercase tracking-wider">
            or sign up with email
          </span>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full rounded-lg border border-border bg-accent/40 pl-9 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              />
            </div>
          </div>

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
                placeholder="ada@example.com"
                className="w-full rounded-lg border border-border bg-accent/40 pl-9 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-border bg-accent/40 pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Checklist */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
              <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-400 font-medium" : ""}`}>
                <Check className={`h-3 w-3 ${hasMinLength ? "opacity-100" : "opacity-30"}`} />
                8+ characters
              </span>
              <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-400 font-medium" : ""}`}>
                <Check className={`h-3 w-3 ${hasNumber ? "opacity-100" : "opacity-30"}`} />
                Contains number
              </span>
              <span className={`flex items-center gap-1 ${hasSpecial ? "text-emerald-400 font-medium" : ""}`}>
                <Check className={`h-3 w-3 ${hasSpecial ? "opacity-100" : "opacity-30"}`} />
                Special character
              </span>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full h-11 font-semibold text-sm gap-2 mt-4"
          >
            <span>Create Account</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
            By creating an account, you agree to read-only GitHub analysis terms. No write permissions are ever requested.
          </p>
        </form>
      </div>
    </AuthCard>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 bg-background">
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SignUpContent />
      </React.Suspense>
    </div>
  );
}
