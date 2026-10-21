"use client";

import * as React from "react";
import { AuthUser } from "@/lib/auth/types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      try {
        localStorage.removeItem("issuepilot_tracked_issues_v1");
        localStorage.removeItem("issuepilot_user_preferences_v1");
        localStorage.removeItem("issuepilot_recent_views_v1");
      } catch {}
      window.location.href = "/";
    }
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      refreshUser: fetchCurrentUser,
      logout,
    }),
    [user, isLoading, fetchCurrentUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
