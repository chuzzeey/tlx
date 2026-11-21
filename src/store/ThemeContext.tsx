"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { createSupabaseAuthBrowserClient } from "@dashboard/lib/supabase-auth-browser";

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

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** Light is the default, regardless of system preference. Account choices sync across devices. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const themeRef = useRef<Theme>("light");
  const themeRevisionRef = useRef(0);
  const userIdRef = useRef<string | null>(null);
  const authReadyRef = useRef(false);
  const pendingThemeRef = useRef<Theme | null>(null);
  const authClientRef = useRef<ReturnType<typeof createSupabaseAuthBrowserClient> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveRevisionRef = useRef(0);

  const applyTheme = useCallback((next: Theme) => {
    themeRevisionRef.current += 1;
    themeRef.current = next;
    setTheme(next);
    applyDocumentTheme(next);
  }, []);

  const saveAccountTheme = useCallback((userId: string, next: Theme) => {
    const client = authClientRef.current;
    if (!client) return;
    const revision = ++saveRevisionRef.current;

    saveQueueRef.current = saveQueueRef.current.then(async () => {
      if (revision !== saveRevisionRef.current || userIdRef.current !== userId) return;

      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        toast.error("Your theme preference couldn't be synced.", { description: sessionError.message });
        return;
      }
      if (session?.user.id !== userId) return;

      const { error } = await client.auth.updateUser({ data: { theme: next } });
      if (error) {
        toast.error("Your theme preference couldn't be synced.", { description: error.message });
      }
    }).catch((cause: unknown) => {
      const message = cause instanceof Error ? cause.message : "The account preference could not be saved.";
      toast.error("Your theme preference couldn't be synced.", { description: message });
    });
  }, []);

  const applySessionTheme = useCallback((user: User | null) => {
    userIdRef.current = user?.id ?? null;
    authReadyRef.current = true;

    const pendingTheme = pendingThemeRef.current;
    if (pendingTheme) {
      pendingThemeRef.current = null;
      applyTheme(pendingTheme);
      if (user) {
        window.setTimeout(() => saveAccountTheme(user.id, pendingTheme), 0);
      } else {
        window.localStorage.setItem("aurelle-theme", pendingTheme);
      }
      return;
    }

    if (user) {
      applyTheme(isTheme(user.user_metadata.theme) ? user.user_metadata.theme : "light");
      return;
    }

    const savedTheme = window.localStorage.getItem("aurelle-theme");
    applyTheme(isTheme(savedTheme) ? savedTheme : "light");
  }, [applyTheme, saveAccountTheme]);

  useEffect(() => {
    let active = true;
    let authEventVersion = 0;
    const savedTheme = window.localStorage.getItem("aurelle-theme");
    const initialTheme = isTheme(savedTheme) ? savedTheme : "light";
    const initialThemeRevision = themeRevisionRef.current;
    themeRef.current = initialTheme;
    applyDocumentTheme(initialTheme);
    window.setTimeout(() => {
      if (active && themeRevisionRef.current === initialThemeRevision) {
        applyTheme(initialTheme);
      }
    }, 0);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      authReadyRef.current = true;
      return () => {
        active = false;
      };
    }

    let client: ReturnType<typeof createSupabaseAuthBrowserClient>;
    try {
      client = createSupabaseAuthBrowserClient();
    } catch (cause) {
      authReadyRef.current = true;
      const message = cause instanceof Error ? cause.message : "Supabase authentication is unavailable.";
      toast.error("Account theme preferences are unavailable.", { description: message });
      return () => {
        active = false;
      };
    }
    authClientRef.current = client;

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      authEventVersion += 1;
      if (active) applySessionTheme(session?.user ?? null);
    });
    const initialAuthEventVersion = authEventVersion;
    void client.auth.getSession().then(({ data, error }) => {
      if (!active || authEventVersion !== initialAuthEventVersion) return;
      if (error) {
        toast.error("Account theme preferences are unavailable.", { description: error.message });
        applySessionTheme(null);
        return;
      }
      applySessionTheme(data.session?.user ?? null);
    }).catch((cause: unknown) => {
      if (!active || authEventVersion !== initialAuthEventVersion) return;
      const message = cause instanceof Error ? cause.message : "Supabase authentication is unavailable.";
      toast.error("Account theme preferences are unavailable.", { description: message });
      applySessionTheme(null);
    });

    return () => {
      active = false;
      authClientRef.current = null;
      subscription.unsubscribe();
    };
  }, [applySessionTheme, applyTheme]);

  const toggle = useCallback(() => {
    const next: Theme = themeRef.current === "light" ? "dark" : "light";
    applyTheme(next);

    if (!authReadyRef.current) {
      pendingThemeRef.current = next;
      return;
    }

    const userId = userIdRef.current;
    if (userId) {
      saveAccountTheme(userId, next);
    } else {
      window.localStorage.setItem("aurelle-theme", next);
    }
  }, [applyTheme, saveAccountTheme]);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
