"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { SiteHeader } from "../../components/SiteHeader";
import { usePreferences } from "../../components/AppPreferences";
import { subjects } from "../../lib/subjects";
import { useState } from "react";

export default function RepositoryPage() {
  const [selectedLevel, setSelectedLevel] =
  useState<"1AS" | "2AS" | "3AS">("3AS");
  const { locale, dark, toggleLocale, toggleDark } = usePreferences();
  const arabic = locale === "ar";
  const label = (subject: (typeof subjects)[number]) => arabic ? subject.ar : subject.name;

  return (
    <main dir={arabic ? "rtl" : "ltr"} className={`${dark ? "dark" : ""} app-shell min-h-screen`}>
      <SiteHeader arabic={arabic} dark={dark} onToggleArabic={toggleLocale} onToggleDark={toggleDark} />
      <section className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-5 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-center gap-1 text-xs text-current/45">
          <Link href="/">{arabic ? "الرئيسية" : "Home"}</Link>
          <ChevronRight size={13} />
          <span>{arabic ? "المكتبة" : "Repository"}</span>
        </div>
        <div className={`mt-10 rounded-2xl border p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-8 ${dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.07] bg-white"}`}>
        <p className="text-xs font-medium uppercase tracking-[.15em] text-current/40">01 / {arabic ? "المكتبة" : "Repository"}</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-.055em] sm:text-4xl lg:text-5xl">{arabic ? "اختر المادة" : "Choose a subject"}</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-current/55">
  {arabic
    ? "نظّم مراجعتك حسب المادة ثم الفصل والصنف، بما في ذلك المراجعة النهائية."
    : "Enter a subject hub to browse resources by trimester, including Final Revision."}
</p>
        </div>

{/* Academic-level selector */}
<div className={`mt-8 rounded-2xl border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.035)] sm:p-6 ${dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.07] bg-white"}`}>
  <p className="mb-3 text-xs font-medium uppercase tracking-[.15em] text-current/40">
    {arabic ? "السنة الدراسية" : "Academic level"}
  </p>

  <div className="flex flex-wrap gap-2">
    {(["1AS", "2AS", "3AS"] as const).map((level) => (
      <button
        key={level}
        type="button"
        onClick={() => setSelectedLevel(level)}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm ${
          selectedLevel === level
            ? "bg-black text-white dark:bg-white dark:text-black"
            : dark
              ? "border-white/15 text-white/70 hover:border-white/40"
              : "border-black/15 text-black/70 hover:border-black/40"
        }`}
      >
        {level}
      </button>
    ))}
  </div>
</div>

<div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {subjects.filter((subject) => subject.levels.includes(selectedLevel)).map((subject) => (
            <Link
            href={`/repository/${subject.slug}?level=${selectedLevel}`}
            key={subject.slug}
            className={`group rounded-2xl border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.045)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(0,0,0,0.09)] ${
              dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.07] bg-white"
            }`}
          >
              <span className={`grid h-11 w-11 place-items-center rounded-xl text-lg font-medium shadow-sm ${subject.tone}`}>{subject.code}</span>
              <h2 className="mt-10 text-xl font-medium tracking-[-.04em]">{label(subject)}</h2>
              <span className={`mt-5 flex items-center border-t pt-4 text-sm text-current/45 transition-colors group-hover:text-current ${dark ? "border-white/10" : "border-black/10"}`}>{arabic ? "فتح المادة" : "Open subject"}<ArrowUpRight className="ml-auto transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={15} /></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
