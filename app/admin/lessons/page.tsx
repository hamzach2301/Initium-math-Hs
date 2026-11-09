"use client";

import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LessonEditorForm, type LessonEditorValues } from "../../../components/LessonEditorForm";
import { SiteHeader } from "../../../components/SiteHeader";
import { usePreferences } from "../../../components/AppPreferences";
import { supabase } from "../../../lib/supabase/client";

type LessonRow = {
  id: string;
  title: string;
  ar_title: string;
  subject: string;
  level: "1AS" | "2AS" | "3AS";
  term: "1" | "2" | "3" | "all";
  file_url: string | null;
  youtube_url: string | null;
};

export default function AdminLessonsPage() {
  const { locale, dark, toggleLocale, toggleDark } = usePreferences();
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [editing, setEditing] = useState<LessonRow | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setAuthorized(false); setMessage("Supabase is not configured in this app."); return; }
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      setAuthorized(false);
      setMessage("You are not signed in in this browser. Sign in from the home page, then return here in the same browser tab.");
      return;
    }
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
    if (profileError) {
      setAuthorized(false);
      setMessage(`Signed in as ${auth.user.email ?? "this account"}, but the profile could not be read: ${profileError.message}`);
      return;
    }
    if (profile?.role !== "admin") {
      setAuthorized(false);
      setMessage(`Signed in as ${auth.user.email ?? "this account"}, but this profile is not marked as an admin.`);
      return;
    }
    const { data, error } = await supabase.from("lessons").select("id, title, ar_title, subject, level, term, file_url, youtube_url").order("created_at", { ascending: false });
    if (error) { setMessage(error.message); return; }
    setLessons((data ?? []) as LessonRow[]);
    setAuthorized(true);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(values: LessonEditorValues) {
    if (!supabase) return;
    const payload = {
      title: values.title.trim(), ar_title: values.ar.trim(), subject: values.subject.trim(), level: values.level,
      term: String(values.term), file_url: values.fileUrl.trim() || null, youtube_url: values.youtubeUrl.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const request = editing ? supabase.from("lessons").update(payload).eq("id", editing.id) : supabase.from("lessons").insert(payload);
    const { error } = await request;
    if (error) { setMessage(error.message); return; }
    setMessage(editing ? "Lesson updated." : "Lesson created.");
    setEditing(null);
    await load();
  }

  const initialValues = editing ? {
    title: editing.title, ar: editing.ar_title, subject: editing.subject, level: editing.level,
    term: editing.term === "all" ? "all" as const : Number(editing.term) as 1 | 2 | 3,
    fileUrl: editing.file_url ?? "", youtubeUrl: editing.youtube_url ?? "",
  } : undefined;

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className={`${dark ? "dark" : ""} app-shell min-h-screen`}>
      <SiteHeader arabic={locale === "ar"} dark={dark} onToggleArabic={toggleLocale} onToggleDark={toggleDark} />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-5 lg:px-8">
        <Link href="/repository" className="inline-flex items-center gap-2 text-sm underline underline-offset-4"><ArrowLeft size={15} />Repository</Link>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[.15em] text-current/45">Administration</p><h1 className="mt-2 text-3xl font-medium tracking-[-.05em]">Lesson editor</h1><p className="mt-2 text-sm text-current/55">Add a document and/or a privacy-enhanced YouTube lesson video.</p></div><button type="button" onClick={() => { setEditing(null); setMessage(null); }} className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"><Plus size={16} />New lesson</button></div>
        {authorized === null ? <p className="mt-10 text-sm text-current/55">Checking administrator access…</p> : authorized ? <><div className="mt-8"><LessonEditorForm key={editing?.id ?? "new"} initialValues={initialValues} onSave={save} submitLabel={editing ? "Update lesson" : "Create lesson"} /></div>{message && <p role="status" className="mt-3 text-sm text-current/65">{message}</p>}<div className="mt-10 overflow-hidden rounded-xl border border-current/10"><div className="border-b border-current/10 px-4 py-3 text-sm font-medium">Existing lessons</div>{lessons.length ? lessons.map((lesson) => <div key={lesson.id} className="flex items-center gap-4 border-b border-current/10 px-4 py-3 last:border-b-0"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{lesson.title}</p><p className="mt-1 text-xs text-current/50">{lesson.subject} · {lesson.level} · {lesson.youtube_url ? "YouTube" : "Document"}</p></div><button type="button" onClick={() => { setEditing(lesson); setMessage(null); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-current/5" aria-label={`Edit ${lesson.title}`}><Pencil size={16} /></button></div>) : <p className="px-4 py-6 text-sm text-current/55">No lessons have been added yet.</p>}</div></> : <div className="mt-10 rounded-xl border border-current/10 p-5"><h2 className="font-medium">Administrator access required</h2><p className="mt-2 text-sm text-current/55">{message ?? <>Sign in with a profile whose role is <code>admin</code> to manage lessons.</>}</p><Link href="/" className="mt-4 inline-block text-sm underline underline-offset-4">Return to the home page</Link></div>}
      </section>
    </main>
  );
}
