"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Menu, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { ThemePicker } from "./ThemePicker";

type NavItem = { href: string; label: string; hash?: string };

export function SiteHeader({
  arabic,
  dark,
  onToggleArabic,
  onToggleDark,
  extra,
  items,
}: {
  arabic: boolean;
  dark: boolean;
  onToggleArabic: () => void;
  onToggleDark: () => void;
  extra?: ReactNode;
  items?: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links: NavItem[] = items ?? [
    { href: "/", label: arabic ? "الرئيسية" : "Dashboard" },
    { href: "/repository", label: arabic ? "المكتبة" : "Repository" },
    { href: "/calendar", label: arabic ? "التقويم" : "Calendar" },
    { href: "/#tracker", label: arabic ? "التقدم" : "Tracker" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    if (href === "/repository") return pathname === "/repository" || /^\/repository\/(?!drive)[^/]+/.test(pathname);
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const linkClass = (href: string) => `rounded-full px-4 py-2 text-sm transition ${isActive(href) ? "theme-accent" : "text-current/55 hover:text-current"}`;

  return (
    <header className="app-header sticky top-3 z-40 mx-3 rounded-2xl border border-black/[.08] bg-[#f8f8f6]/85 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/[.10] dark:bg-[#151515]/85 dark:shadow-black/30">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#161616] text-white">
            <span className="font-serif text-lg italic leading-none">∑</span>
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.035em]">Initium Math.HS</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((item) => (
            <Link key={item.href + item.label} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {extra && <div className="hidden lg:block">{extra}</div>}
          <ThemePicker align={arabic ? "left" : "right"} />
          <button onClick={onToggleArabic} className={`flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-semibold ${dark ? "border-white/15" : "border-black/10"}`}>
            <Languages size={14} />
            {arabic ? "EN" : "AR"}
          </button>
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center lg:hidden">
            <Menu size={19} />
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 z-50 bg-black/25 backdrop-blur-[1px]" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className={`theme-surface absolute top-3 z-[60] flex h-[calc(100dvh-24px)] w-[min(78vw,280px)] flex-col overflow-y-auto rounded-2xl border border-current/10 bg-[#f8f8f6]/95 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:bg-[#151515]/95 dark:shadow-black/50 ${arabic ? "left-3 border-r" : "right-3 border-l"}`}>
            <div className="flex h-[72px] items-center justify-between border-b border-current/10 px-5">
              <span className="text-sm font-semibold">Initium Math.HS</span>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center">
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {links.map((item) => (
                <Link key={item.href + item.label} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                  {item.label}
                </Link>
              ))}
              {extra && <div className="mt-3 border-t border-current/10 pt-3 lg:hidden">{extra}</div>}
              <div className="mt-3 border-t border-current/10 pt-3"><ThemePicker align={arabic ? "left" : "right"} /></div>
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
