"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PdfViewer } from "../../../../components/PdfViewer";
import { SiteHeader } from "../../../../components/SiteHeader";
import { usePreferences } from "../../../../components/AppPreferences";
import { subjectBySlug } from "../../../../lib/subjects";

function ViewerBody() {
  const params = useParams<{ subject: string }>();
  const search = useSearchParams();
  const subject = subjectBySlug(params.subject);
  const src = search.get("src") ?? undefined;
  const { locale, dark, toggleLocale, toggleDark } = usePreferences();
  const arabic = locale === "ar";
  return (
    <main dir={arabic ? "rtl" : "ltr"} className={`${dark ? "dark" : ""} app-shell min-h-screen overflow-x-hidden`}>
      <SiteHeader arabic={arabic} dark={dark} onToggleArabic={toggleLocale} onToggleDark={toggleDark} />
      <header className={`border-b ${dark ? "border-white/10" : "border-black/10"}`}>
        <div className="mx-auto flex h-[64px] max-w-5xl items-center px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <Link href={`/repository/${params.subject}`} className="flex items-center gap-2 text-sm underline underline-offset-4">
            <ArrowLeft size={15} />
            {arabic ? "العودة إلى " : "Back to "}{arabic ? subject?.ar ?? "المكتبة" : subject?.name ?? "repository"}
          </Link>
        </div>
      </header>
      <PdfViewer source={src} workspace allowUpload className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8" />
    </main>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center text-sm">Loading viewer…</main>}>
      <ViewerBody />
    </Suspense>
  );
}
