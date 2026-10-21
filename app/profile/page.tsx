"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Lock,
  Shield,
  Sliders,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { PreferencesEditor } from "@/components/profile/preferences-editor";
import { SecuritySettings } from "@/components/profile/security-settings";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = React.useState<"profile" | "preferences" | "security">("profile");

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div
        className="hero-orb w-[500px] h-[500px] bg-indigo-600 top-[-100px] left-[-60px]"
        aria-hidden="true"
      />
      <div
        className="hero-orb w-[400px] h-[400px] bg-violet-600 top-[60px] right-[-40px] opacity-[0.10]"
        aria-hidden="true"
      />

      <Navbar />

      <main className="flex-1 container mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 space-y-8 relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !isAuthenticated || !user ? (
          <div className="glass-card p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary backdrop-blur-md shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Sign In Required</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You must be signed in to manage your contributor profile, customize your preferred tech stack, and adjust contribution goals.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button onClick={() => router.push("/auth/signin?redirect=/profile")} className="text-xs font-semibold gap-1.5">
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" onClick={() => router.push("/explore")} className="text-xs">
                Browse Issues
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-primary/30 bg-primary/10 text-primary backdrop-blur-md shadow-sm mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Contributor Settings</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-foreground">
                Profile &amp; Personalization
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Manage your public contributor identity, calibrate relevance scoring for recommended issues, and manage account security.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-border/60 pb-px text-xs font-medium overflow-x-auto whitespace-nowrap">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
                  activeTab === "profile"
                    ? "border-primary text-foreground font-semibold bg-accent/30"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Profile Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("preferences")}
                className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
                  activeTab === "preferences"
                    ? "border-primary text-foreground font-semibold bg-accent/30"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Sliders className="h-4 w-4 text-cyan-400" />
                <span>Tech Stack & Goals</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`px-4 py-2.5 rounded-t-lg transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
                  activeTab === "security"
                    ? "border-primary text-foreground font-semibold bg-accent/30"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Security & Data</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="glass-card p-4 sm:p-8">
              {activeTab === "profile" && (
                <ProfileEditor
                  user={user}
                  onProfileUpdated={() => refreshUser()}
                />
              )}

              {activeTab === "preferences" && <PreferencesEditor />}

              {activeTab === "security" && <SecuritySettings />}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
