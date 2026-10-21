"use client";

import * as React from "react";

type Theme = "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light";
}

const ThemeContext = React.createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  actualTheme: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    try {
      localStorage.setItem("issuepilot-theme", "light");
    } catch {
      // Ignore storage errors in restricted contexts
    }

    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", setTheme: () => {}, actualTheme: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
