"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, type ThemeName, useTheme } from "./ThemeProvider";

export type Locale = "en" | "ar";

type Preferences = {
  locale: Locale;
  dark: boolean;
  theme: ThemeName;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  setDark: (dark: boolean) => void;
  setTheme: (theme: ThemeName) => void;
  toggleDark: () => void;
};

const PreferencesContext = createContext<Preferences | null>(null);
const LOCALE_KEY = "initium-locale";

export function AppPreferences({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ThemeProvider><LocalePreferences>{children}</LocalePreferences></ThemeProvider>;
}

function LocalePreferences({ children }: Readonly<{ children: React.ReactNode }>) {
  // Stable defaults make server and first client render identical; persisted settings apply after hydration.
  const [locale, setLocaleState] = useState<Locale>("en");
  const { dark, setTheme, theme } = useTheme();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(LOCALE_KEY);
    if (savedLocale === "ar" || savedLocale === "en") setLocaleState(savedLocale);
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    if (hydrated) {
      window.localStorage.setItem(LOCALE_KEY, locale);
    }
  }, [locale, hydrated]);

  const value = useMemo<Preferences>(() => ({
    locale,
    dark,
    theme,
    hydrated,
    setLocale: setLocaleState,
    toggleLocale: () => setLocaleState((current) => current === "en" ? "ar" : "en"),
    setDark: (nextDark) => setTheme(nextDark ? "notion-dark" : "notion-light"),
    setTheme,
    toggleDark: () => setTheme(dark ? "notion-light" : "notion-dark"),
  }), [locale, dark, hydrated, setTheme, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error("usePreferences must be used within AppPreferences");
  return preferences;
}
