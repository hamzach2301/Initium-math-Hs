"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, FileText, PenLine, Play, Search, Video, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import { usePreferences } from "../../../components/AppPreferences";
import { materialProgressId, materialsFor, type Material, type TermKey } from "../../../lib/repository";
import { PdfViewer } from "../../../components/PdfViewer";
import { subjectBySlug } from "../../../lib/subjects";
import { useProgress } from "../../../lib/useProgress";
import { YouTubeEmbed } from "../../../components/YouTubeEmbed";
import { supabase } from "../../../lib/supabase/client";
import { getYouTubeThumbnailUrl, parseYouTubeVideo } from "../../../lib/youtube";

type DatabaseLesson = {
  id: string;
  title: string;
  ar_title: string;
  subject: string;
  level: Material["level"];
  term: "1" | "2" | "3" | "all";
  file_url: string | null;
  youtube_url: string | null;
};

const trimesterCategories = [
  { en: "Duty / Homework", ar: "الفروض", kind: "homework" as const },
  { en: "Exams", ar: "الاختبارات", kind: "exam" as const },
  { en: "Exercise Series", ar: "سلاسل التمارين", kind: "series" as const },
  { en: "Lessons / Summaries", ar: "الدروس والملخصات", kind: "lesson" as const },
  { en: "Video Lessons", ar: "دروس فيديو", kind: "video" as const },
  { en: "books", ar: "كتب خارجية ومجلات", kind: "books" as const },
];

const finalCategories = [
  { en: "Summary sheets", ar: "ملخصات", kind: "summary" as const },
  { en: "Past BAC topics", ar: "مواضيع بكالوريا", kind: "bac" as const },
  { en: "Comprehensive review series", ar: "سلاسل مراجعة شاملة", kind: "series" as const },
];

export default function SubjectPage() {
  const searchParams = useSearchParams();
  const levelFromUrl = searchParams.get("level") || "3AS";
  const { completedIds, toggleComplete, isLoaded, error: progressError } = useProgress();
  const params = useParams<{ subject: string }>();
  const subject = subjectBySlug(params.subject);
  const { locale, dark, toggleLocale, toggleDark } = usePreferences();
  const arabic = locale === "ar";
  const [trimester, setTrimester] = useState<TermKey>(1);
  const [category, setCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Material | null>(null);
  const [databaseVideos, setDatabaseVideos] = useState<Material[]>([]);
  const categories = trimester === "final" ? finalCategories : trimesterCategories;
  const activeCategory = categories[Math.min(category, categories.length - 1)];

  useEffect(() => {
    if (!supabase || !subject) return;
    let active = true;
    void supabase.from("lessons")
      .select("id, title, ar_title, subject, level, term, file_url, youtube_url")
      .eq("subject", subject.slug)
      .eq("level", levelFromUrl)
      .then(({ data, error }) => {
        if (!active || error) return;
        setDatabaseVideos(((data ?? []) as DatabaseLesson[]).filter((lesson) => Boolean(lesson.youtube_url)).map((lesson) => ({
          id: `database-${lesson.id}`,
          title: lesson.title,
          ar: lesson.ar_title || lesson.title,
          kind: "video",
          term: lesson.term === "all" ? "all" : Number(lesson.term) as 1 | 2 | 3,
          subject: lesson.subject,
          fileUrl: lesson.file_url ?? "",
          youtubeUrl: lesson.youtube_url ?? undefined,
          level: lesson.level,
        })));
      });
    return () => { active = false; };
  }, [levelFromUrl, subject]);

  const documents = useMemo(() => {
    if (!subject) return [];
    const curated = materialsFor(
      subject.slug,
      trimester,
      activeCategory.kind
    ).filter((document) => {
      return document.level === levelFromUrl;
    });
    if (activeCategory.kind !== "video") return curated;
    return [...curated, ...databaseVideos.filter((video) => video.term === trimester || video.term === "all")];
  }, [
    subject,
    trimester,
    activeCategory.kind,
    levelFromUrl,
    databaseVideos,
  ]);  
  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return documents;

    return documents.filter((document) =>
      [document.title, document.ar, document.fileUrl, document.youtubeUrl]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [documents, searchQuery]);

  if (!subject) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f8f6]">
        <div className="text-center">
          <p className="text-xl font-medium">Subject not found.</p>
          <Link href="/repository" className="mt-4 inline-block text-sm underline underline-offset-4">Back to repository</Link>
        </div>
      </main>
    );
  }

  const subjectName = arabic ? subject.ar : subject.name;
  const categoryName = arabic ? activeCategory.ar : activeCategory.en;
  const trimesterName = trimester === "final" ? (arabic ? "المراجعة النهائية" : "Final Revision") : (arabic ? `الفصل ${trimester}` : `Trimester ${trimester}`);

  // NEW LOGIC: Calculate progress for the current view
  const trackableCategories = ["homework", "exam", "series"];
  const showProgress = trackableCategories.includes(activeCategory.kind);
  const totalItems = documents.length;
  const completedItems = documents.filter((doc) => completedIds.includes(materialProgressId(doc))).length;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  return (
    <main dir={arabic ? "rtl" : "ltr"} className={`${dark ? "dark" : ""} app-shell min-h-screen`}>
      <SiteHeader arabic={arabic} dark={dark} onToggleArabic={toggleLocale} onToggleDark={toggleDark} />
      <section className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-8 lg:py-16">
        <div className="flex flex-wrap items-center gap-1 text-xs text-current/45">
          <Link href="/">{arabic ? "الرئيسية" : "Home"}</Link>
          <ChevronRight size={13} />
          <Link href="/repository">{arabic ? "المكتبة" : "Repository"}</Link>
          <ChevronRight size={13} />
          <span>{subjectName}</span>
          <ChevronRight size={13} />
          <span>{trimesterName}</span>
        </div>
        <div className={`mt-10 flex flex-col justify-between gap-6 rounded-2xl border p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:mt-12 sm:flex-row sm:items-end sm:p-8 ${dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.07] bg-white"}`}>
          <div>
            <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl font-medium ${subject.tone}`}>{subject.code}</span>
            <h1 className="mt-5 text-3xl font-medium tracking-[-.055em] sm:text-4xl lg:text-5xl">{subjectName}</h1>
            <p className="mt-3 text-sm text-current/55">{arabic ? "مصادر منظمة حسب الفصول والأنواع، مع تبويب المراجعة النهائية." : "A focused resource hub by trimester, category, and Final Revision."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/repository/${subject.slug}/viewer`} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-sm ${dark ? "border-white/15" : "border-black/10"}`}>
              <PenLine size={15} />
              {arabic ? "مساحة PDF" : "PDF workspace"}
            </Link>
            <Link href="/repository" className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-sm ${dark ? "border-white/15" : "border-black/10"}`}>
              <ArrowLeft size={15} />
              {arabic ? "كل المواد" : "All subjects"}
            </Link>
          </div>
        </div>
        <div
  className={`mt-8 rounded-2xl border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.035)] sm:mt-10 sm:p-6 ${
    dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.07] bg-white"
  }`}
>
  {/* Trimesters */}
  <div>
    <p className="mb-3 text-xs font-medium uppercase tracking-[.15em] text-current/40">
      {arabic ? "الفصل" : "Trimester"}
    </p>

    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      {[1, 2, 3].map((term) => (
        <button
          key={term}
          onClick={() => {
            setTrimester(term as TermKey);
            setCategory(0);
          }}
          className={`shrink-0 rounded-full px-4 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-sm ${
            trimester === term
              ? "bg-black text-white dark:bg-white dark:text-black"
              : dark
                ? "bg-white/10"
                : "bg-black/5"
          }`}
        >
          {arabic ? `الفصل ${term}` : `Trimester ${term}`}
        </button>
      ))}
    </div>
  </div>

  {/* Categories */}
  <div className="mt-7">
    <p className="mb-3 text-xs font-medium uppercase tracking-[.15em] text-current/40">
      {arabic ? "الصنف" : "Category"}
    </p>

    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      {categories.map((item, index) => (
        <button
          key={item.en}
          onClick={() => setCategory(index)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-sm ${
            category === index
              ? "bg-black text-white dark:bg-white dark:text-black"
              : dark
                ? "bg-white/10"
                : "bg-black/5"
          }`}
        >
          {arabic ? item.ar : item.en}
        </button>
      ))}
    </div>
  </div>

  {/* Progress */}
  {showProgress && isLoaded && totalItems > 0 && (
    <div className="mt-7 w-full sm:w-64 flex flex-col gap-2 pb-1">
      <div className="flex justify-between text-xs font-medium text-current/60">
        <span>
          {completedItems} / {totalItems}{" "}
          {arabic ? "مكتمل" : "completed"}
        </span>
        <span>{progressPercentage}%</span>
      </div>

      <div
        className={`h-2 w-full rounded-full overflow-hidden ${
          dark ? "bg-white/10" : "bg-black/10"
        }`}
      >
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )}
  {progressError && <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">{arabic ? "تعذر حفظ التقدم. حاول مرة أخرى." : "Progress could not be saved. Please try again."}</p>}
</div>

        <div className="relative mt-6 max-w-xl">
          <Search
            size={16}
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${arabic ? "right-4" : "left-4"} text-current/40`}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={arabic ? "ابحث عن ملف بالاسم..." : "Search files by name..."}
            aria-label={arabic ? "البحث عن ملف" : "Search files"}
            className={`w-full rounded-xl border py-3 text-sm outline-none shadow-[0_6px_18px_rgba(0,0,0,0.035)] transition focus:border-current/40 focus:shadow-[0_8px_22px_rgba(0,0,0,0.07)] ${arabic ? "pr-11 pl-4" : "pl-11 pr-4"} ${dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.07] bg-white"}`}
          />
        </div>

        {filteredDocuments.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((item) => (
          <div
            key={materialProgressId(item)}
            onClick={() => setSelectedDocument(item)}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border text-start shadow-[0_8px_24px_rgba(0,0,0,0.045)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(0,0,0,0.09)] ${dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.07] bg-white"}`}
          >
            {/* NEW CHECKBOX */}
            {showProgress && isLoaded && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleComplete(materialProgressId(item));
                }}
                className={`absolute top-4 end-4 z-10 p-1.5 rounded-md border transition-all ${
                  completedIds.includes(materialProgressId(item))
                    ? "bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600"
                    : dark
                      ? "bg-[#151515] text-white/30 border-white/20 hover:border-emerald-500 hover:text-emerald-500"
                      : "bg-white text-black/30 border-black/20 hover:border-emerald-500 hover:text-emerald-500"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}

            {item.youtubeUrl && parseYouTubeVideo(item.youtubeUrl) ? (
              <div className="relative aspect-video overflow-hidden bg-black">
                <img src={getYouTubeThumbnailUrl(parseYouTubeVideo(item.youtubeUrl)!.videoId)} alt="" className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 bg-black/15" aria-hidden="true" />
                <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-red-600 text-white shadow-lg transition duration-200 group-hover:scale-110" aria-hidden="true"><Play size={22} className="ml-0.5" fill="currentColor" /></span>
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white"><Video size={13} aria-hidden="true" />{arabic ? "درس فيديو" : "VIDEO LESSON"}</span>
              </div>
            ) : null}
            <div className="p-5">
              {!item.youtubeUrl && <FileText size={18} className="text-current/40" />}
              <h3 className={`${item.youtubeUrl ? "" : "mt-4"} text-base font-medium tracking-[-.02em] ${showProgress ? "pe-10" : ""}`}>{arabic ? item.ar : item.title}</h3>
              <p className="mt-2 text-xs text-current/50">{trimesterName} · {item.youtubeUrl ? (arabic ? "فيديو" : "Video") : categoryName}</p>
              <p className="mt-3 text-sm underline underline-offset-4">{item.youtubeUrl ? (arabic ? "شاهد الفيديو" : "Watch video") : (arabic ? "عرض داخل التطبيق" : "View in app")}</p>
            </div>
          </div>
        ))}


          </div>
        ) : searchQuery.trim() ? (
          <div className={`mt-6 flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center sm:min-h-[300px] ${dark ? "border-white/15" : "border-black/15"}`}>
            <Search size={22} className="text-current/35" strokeWidth={1.4} />
            <p className="mt-4 text-sm font-medium">{arabic ? "لم يتم العثور على ملفات." : "No matching files found."}</p>
            <p className="mt-1 max-w-md text-xs text-current/45">{arabic ? `لا توجد نتائج لـ "${searchQuery}".` : `No files match "${searchQuery}".`}</p>
          </div>
        ) : (
          <div className={`mt-6 flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center sm:min-h-[300px] ${dark ? "border-white/15" : "border-black/15"}`}>
            <FileText size={22} className="text-current/35" strokeWidth={1.4} />
            <p className="mt-4 text-sm font-medium">{arabic ? "لا توجد وثائق مضافة بعد." : "No documents added yet."}</p>
            <p className="mt-1 text-xs text-current/45">{subjectName} · {trimesterName} · {categoryName}</p>
            <p className="mt-1 max-w-md text-xs text-current/45">
              {trimester === "final"
                ? (arabic ? "ملخصات، مواضيع بكالوريا، وسلاسل مراجعة شاملة ستظهر هنا." : "Summary sheets, BAC topics, and comprehensive revision series will appear here.")
                : (arabic ? "بانتظار رفع الإدارة للملفات." : "Admin upload pending.")}
            </p>
          </div>
        )}
      </section>
      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={arabic ? selectedDocument.ar : selectedDocument.title}>
          <button className="absolute inset-0" onClick={() => setSelectedDocument(null)} aria-label="Close document preview" />
          <section className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border sm:mx-auto sm:max-w-6xl sm:rounded-2xl ${dark ? "border-white/10 bg-[#171717]" : "border-black/10 bg-[#f8f8f6]"}`}>
            <header className={`flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-5 ${dark ? "border-white/10" : "border-black/10"}`}><div className="min-w-0"><p className="truncate text-sm font-medium">{arabic ? selectedDocument.ar : selectedDocument.title}</p><p className="mt-0.5 text-xs text-current/45">{selectedDocument.youtubeUrl ? "YouTube" : "Google Drive"}</p></div><button onClick={() => setSelectedDocument(null)} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"><X size={18}/></button></header>
            {selectedDocument.youtubeUrl ? <YouTubeEmbed url={selectedDocument.youtubeUrl} title={arabic ? selectedDocument.ar : selectedDocument.title} className="m-4 sm:m-5" /> : <PdfViewer source={selectedDocument.fileUrl} title={arabic ? selectedDocument.ar : selectedDocument.title} className="min-h-[58vh] flex-1 sm:min-h-[70vh]" />}
          </section>
        </div>
      )}
    </main>
  );
}
