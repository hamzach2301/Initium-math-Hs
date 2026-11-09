"use client";

import Link from "next/link";
import { AcademicCalendar } from "../../components/AcademicCalendar";
import { SiteHeader } from "../../components/SiteHeader";
import { usePreferences } from "../../components/AppPreferences";

export default function CalendarPage() {
  const { locale, dark, toggleLocale, toggleDark } = usePreferences();
  const arabic = locale === "ar";
  return (
    <main dir={arabic ? "rtl" : "ltr"} className={`${dark ? "dark" : ""} app-shell min-h-screen`}>
      <SiteHeader arabic={arabic} dark={dark} onToggleArabic={toggleLocale} onToggleDark={toggleDark} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 lg:px-8 lg:py-16">
        <Link href="/" className="text-sm underline underline-offset-4">{arabic ? "الرئيسية" : "Home"}</Link>
        <div className="mt-10">
          <AcademicCalendar arabic={arabic} dark={dark} />
        </div>
      </section>
    </main>
  );
}
