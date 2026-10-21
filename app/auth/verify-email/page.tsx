"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.message || "Your email address has been verified.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification token is invalid or has expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error verifying email.");
      }
    }

    verify();
  }, [token]);

  return (
    <AuthCard
      title="Email Verification"
      description="Verifying your IssuePilot account email address."
      footer={
        <Link
          href="/auth/signin"
          className="text-primary hover:underline font-semibold"
        >
          Go to Sign In
        </Link>
      }
    >
      <div className="py-4 text-center space-y-4">
        {status === "loading" && (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Verifying your token with the server...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Verified Successfully</h3>
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
            <Link
              href="/auth/signin?verified=true"
              className="inline-flex items-center justify-center w-full h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors gap-2 mt-2"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/30">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Verification Failed</h3>
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center w-full h-10 px-4 rounded-lg border border-border bg-background hover:bg-accent text-foreground font-medium text-sm transition-colors mt-2"
            >
              <span>Back to Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 bg-background">
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <VerifyEmailContent />
      </React.Suspense>
    </div>
  );
}
