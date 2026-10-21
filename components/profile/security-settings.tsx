"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, KeyRound, LogOut, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

export function SecuritySettings() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isClearingData, setIsClearingData] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to clear your saved issue bookmarks and recently viewed history?")) {
      return;
    }

    setIsClearingData(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_data" }),
      });

      if (res.ok) {
        setMessage("Personal bookmarks and history have been cleared.");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      // Handle error
    } finally {
      setIsClearingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== "delete my account") {
      alert("Please type 'delete my account' to confirm.");
      return;
    }

    setIsDeletingAccount(true);

    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
      });

      if (res.ok) {
        window.location.href = "/";
      }
    } catch {
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Password & Authentication */}
      <div className="glass-card p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-primary" />
              <span>Password &amp; Credentials</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              To update your account password, request a secure verification link to your registered email.
            </p>
          </div>
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={() => router.push("/auth/forgot-password")}
            className="text-xs shrink-0"
          >
            Reset Password
          </Button>
        </div>
      </div>

      {/* Clear Personal Bookmarks */}
      <div className="glass-card p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <span>Clear Workspace Bookmarks &amp; History</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Remove all tracked issues, notes, and recently viewed tickets while keeping your account and profile active.
            </p>
          </div>
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={handleClearData}
            isLoading={isClearingData}
            className="text-xs shrink-0"
          >
            Clear Data
          </Button>
        </div>
      </div>

      {/* Session Sign Out */}
      <div className="glass-card p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <span>Sign Out of Current Session</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Terminates your current session and clears your authentication cookie.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={logout}
            className="text-xs shrink-0"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="glass-card p-4 sm:p-5 border-destructive/30 bg-destructive/5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            <span>Danger Zone: Permanent Account Deletion</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Permanently deletes your account, user profile, saved issues, notes, and personalized settings. This action is irreversible.
          </p>
        </div>

        {showDeleteConfirm ? (
          <div className="p-3.5 rounded-lg border border-destructive/30 bg-background/80 space-y-3">
            <p className="text-xs font-semibold text-destructive">
              Type <code className="bg-destructive/10 px-1.5 py-0.5 rounded text-destructive">delete my account</code> below to confirm permanent removal:
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="delete my account"
              className="w-full rounded-md border border-destructive/40 bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-destructive"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                isLoading={isDeletingAccount}
                className="text-xs"
              >
                Permanently Delete Account
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmationText("");
                }}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs"
          >
            Delete Account
          </Button>
        )}
      </div>
    </div>
  );
}
