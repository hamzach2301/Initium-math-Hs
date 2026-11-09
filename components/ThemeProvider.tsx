"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase/client";

export const themes = {
  "notion-light": { label: "Notion Light", canvas: "#F7F6F3", accent: "#37352F", dark: false },
  "notion-dark": { label: "Notion Dark", canvas: "#191919", accent: "#D4D4D4", dark: true },
  "akiflow-midnight": { label: "Akiflow Midnight", canvas: "#0F172A", accent: "#6366F1", dark: true },
  "warm-sepia": { label: "Warm Sepia", canvas: "#FBF7EE", accent: "#A66A42", dark: false },
} as const;

export type ThemeName = keyof typeof themes;

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  dark: boolean;
  hydrated: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
export const THEME_STORAGE_KEY = "initium-theme";

function isTheme(value: string | null): value is ThemeName {
  return Boolean(value && value in themes);
}

function preferredTheme(): ThemeName {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "notion-dark" : "notion-light";
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [theme, setThemeState] = useState<ThemeName>("notion-light");
  const [hydrated, setHydrated] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    setThemeState(isTheme(saved) ? saved : preferredTheme());
    setHydrated(true);

    const client = supabase;
    if (!client) { setProfileReady(true); return; }
    const syncProfile = async (id: string | null) => {
      setUserId(id);
      if (id) {
        setProfileReady(false);
        const { data: profile } = await client.from("profiles").select("theme").eq("id", id).maybeSingle();
        const remoteTheme = profile?.theme ?? null;
        if (isTheme(remoteTheme)) setThemeState(remoteTheme);
      }
      setProfileReady(true);
    };
    void client.auth.getUser().then(({ data }) => syncProfile(data.user?.id ?? null));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => void syncProfile(session?.user?.id ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", themes[theme].dark);
    if (hydrated) window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated || !profileReady || !userId || !supabase) return;
    // The migration grants users access only to their own preference column.
    void supabase.from("profiles").update({ theme, updated_at: new Date().toISOString() }).eq("id", userId);
  }, [theme, hydrated, profileReady, userId]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: setThemeState,
    dark: themes[theme].dark,
    hydrated,
  }), [theme, hydrated]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
