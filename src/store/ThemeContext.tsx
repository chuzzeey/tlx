"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: "light", toggle: () => {} });

function applyDocumentTheme(theme: Theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? "#10100f" : "#ffffff");
}

/**
 * Light is the default, regardless of system preference. The pre-paint inline
 * script in app/layout.tsx applies the saved choice before hydration; here we
 * sync React state and browser theme metadata after mount and on each toggle.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("aurelle-theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    applyDocumentTheme(initialTheme);
    if (initialTheme === "dark") setTheme("dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyDocumentTheme(next);
    window.localStorage.setItem("aurelle-theme", next);
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
