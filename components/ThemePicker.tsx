"use client";

import { Palette } from "lucide-react";
import { KeyboardEvent, useRef, useState } from "react";
import { themes, type ThemeName, useTheme } from "./ThemeProvider";

const themeNames = Object.keys(themes) as ThemeName[];

export function ThemePicker({ align = "right" }: { align?: "left" | "right" }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function choose(nextTheme: ThemeName) {
    setTheme(nextTheme);
    setOpen(false);
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? (index + 1) % themeNames.length : event.key === "ArrowUp" ? (index - 1 + themeNames.length) % themeNames.length : event.key === "Home" ? 0 : themeNames.length - 1;
    optionRefs.current[next]?.focus();
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="listbox" aria-expanded={open} aria-label="Choose theme" className="grid h-9 w-9 place-items-center rounded-full border border-current/15 transition hover:bg-current/5">
        <Palette size={16} aria-hidden="true" />
      </button>
      {open && (
        <div role="listbox" aria-label="Theme options" className={`absolute top-11 z-[70] w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-current/10 bg-[var(--color-surface)] p-1.5 shadow-xl ${align === "left" ? "left-0" : "right-0"}`}>
          {themeNames.map((name, index) => {
            const item = themes[name];
            return <button key={name} ref={(element) => { optionRefs.current[index] = element; }} type="button" role="option" aria-selected={theme === name} onClick={() => choose(name)} onKeyDown={(event) => navigate(event, index)} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-current/5 ${theme === name ? "bg-current/10" : ""}`}>
              <span className="flex -space-x-1" aria-hidden="true"><span className="h-4 w-4 rounded-full border border-black/10" style={{ background: item.canvas }} /><span className="h-4 w-4 rounded-full border border-black/10" style={{ background: item.accent }} /></span>
              <span className="flex-1">{item.label}</span>
              {theme === name && <span className="text-xs text-current/55">Active</span>}
            </button>;
          })}
        </div>
      )}
    </div>
  );
}
