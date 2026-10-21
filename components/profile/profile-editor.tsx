"use client";

import * as React from "react";
import Image from "next/image";
import { AuthUser } from "@/lib/auth/types";
import { CheckCircle2, Github, Save, ShieldCheck, User, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileEditorProps {
  user: AuthUser;
  onProfileUpdated: (updated: Partial<AuthUser>) => void;
}

export function ProfileEditor({ user, onProfileUpdated }: ProfileEditorProps) {
  const [name, setName] = React.useState(user.name || "");
  const [bio, setBio] = React.useState(user.bio || "");
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          bio: bio.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update profile.");
        return;
      }

      onProfileUpdated({
        name: data.user.name,
        bio: data.user.bio,
        avatarUrl: data.user.avatarUrl,
      });
      setSuccessMessage("Profile updated successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage("Network error updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner: Verified Identity distinction */}
      <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          {avatarUrl ? (
            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border/80 dark:border-white/10 bg-card shrink-0 shadow-sm">
              <Image
                src={avatarUrl}
                alt={name || user.email}
                width={56}
                height={56}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary text-xl font-bold shrink-0 backdrop-blur-md">
              {(name || user.email).charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">{name || "Contributor"}</h2>
              {user.githubUsername ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Verified GitHub
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/80 dark:border-white/10 bg-muted/60 dark:bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                  Email Account
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* GitHub Link or Connect Action */}
        {user.githubUsername ? (
          <a
            href={`https://github.com/${user.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 dark:border-white/10 bg-background/50 dark:bg-white/5 backdrop-blur-md hover:bg-accent text-xs font-mono text-foreground transition-colors shrink-0"
          >
            <Github className="h-3.5 w-3.5" />
            <span>@{user.githubUsername}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        ) : (
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={() => (window.location.href = "/api/auth/github?returnUrl=/profile")}
            className="text-xs gap-1.5 shrink-0"
          >
            <Github className="h-3.5 w-3.5" />
            <span>Connect GitHub</span>
          </Button>
        )}
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          {errorMessage}
        </div>
      )}

      {/* Editable Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground" htmlFor="displayName">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name or handle"
            className="w-full rounded-xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-card/40 backdrop-blur-md px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground" htmlFor="avatarUrl">
            Avatar Image URL
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://avatars.githubusercontent.com/..."
            className="w-full rounded-xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-card/40 backdrop-blur-md px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground" htmlFor="bio">
              Biography
            </label>
            <span className="text-[10px] text-muted-foreground">{bio.length}/500</span>
          </div>
          <textarea
            id="bio"
            rows={3}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share a short summary of your background, experience, or what open-source projects you love..."
            className="w-full rounded-xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-card/40 backdrop-blur-md px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          isLoading={isSaving}
          className="h-10 px-5 text-xs font-semibold gap-2"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save Profile</span>
        </Button>
      </div>
    </form>
  );
}
