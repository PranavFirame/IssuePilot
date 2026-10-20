"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "dark" | "light";
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("dark");
  const [actualTheme, setActualTheme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    const saved = localStorage.getItem("issuepilot-theme") as Theme | null;
    if (saved) {
      setTheme(saved);
    } else {
      setTheme("dark"); // Default to dark for developer dashboard
    }
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    let resolved: "dark" | "light" = "dark";
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = theme;
    }

    setActualTheme(resolved);
    root.classList.add(resolved);
    localStorage.setItem("issuepilot-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
