"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

interface ThemeCtx {
  theme: "light";
}

const Ctx = createContext<ThemeCtx>({ theme: "light" });

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#FFFFFF");
  }, []);

  return <Ctx.Provider value={{ theme: "light" }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
