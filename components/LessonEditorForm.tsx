"use client";

import { FormEvent, useState } from "react";
import { LessonVideoField } from "./LessonVideoField";
import { parseYouTubeVideoId } from "../lib/youtube";

export type LessonEditorValues = {
  title: string;
  ar: string;
  subject: string;
  level: "1AS" | "2AS" | "3AS";
  term: 1 | 2 | 3 | "all";
  fileUrl: string;
  youtubeUrl: string;
};

type LessonEditorFormProps = {
  initialValues?: Partial<LessonEditorValues>;
  onSave: (values: LessonEditorValues) => void | Promise<void>;
  submitLabel?: string;
};

/** A reusable create/edit lesson form; callers own persistence and authorization. */
export function LessonEditorForm({ initialValues, onSave, submitLabel = "Save lesson" }: LessonEditorFormProps) {
  const [values, setValues] = useState<LessonEditorValues>({ title: "", ar: "", subject: "", level: "3AS", term: 1, fileUrl: "", youtubeUrl: "", ...initialValues });
  const [submitting, setSubmitting] = useState(false);
  const validVideo = !values.youtubeUrl.trim() || Boolean(parseYouTubeVideoId(values.youtubeUrl));
  const set = <K extends keyof LessonEditorValues>(key: K, value: LessonEditorValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validVideo) return;
    setSubmitting(true);
    try { await onSave(values); } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border border-current/10 p-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Lesson title<input required value={values.title} onChange={(event) => set("title", event.target.value)} className="mt-2 w-full rounded-lg border border-current/15 bg-transparent px-3 py-2.5 text-sm font-normal outline-none focus:border-current/45" /></label>
        <label className="text-sm font-medium">Arabic title<input required value={values.ar} onChange={(event) => set("ar", event.target.value)} className="mt-2 w-full rounded-lg border border-current/15 bg-transparent px-3 py-2.5 text-sm font-normal outline-none focus:border-current/45" /></label>
      </div>
      <label className="text-sm font-medium">Subject<input required value={values.subject} onChange={(event) => set("subject", event.target.value)} className="mt-2 w-full rounded-lg border border-current/15 bg-transparent px-3 py-2.5 text-sm font-normal outline-none focus:border-current/45" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Level<select value={values.level} onChange={(event) => set("level", event.target.value as LessonEditorValues["level"])} className="mt-2 w-full rounded-lg border border-current/15 bg-transparent px-3 py-2.5 text-sm font-normal outline-none focus:border-current/45"><option>1AS</option><option>2AS</option><option>3AS</option></select></label>
        <label className="text-sm font-medium">Term<select value={values.term} onChange={(event) => set("term", event.target.value === "all" ? "all" : Number(event.target.value) as 1 | 2 | 3)} className="mt-2 w-full rounded-lg border border-current/15 bg-transparent px-3 py-2.5 text-sm font-normal outline-none focus:border-current/45"><option value={1}>Trimester 1</option><option value={2}>Trimester 2</option><option value={3}>Trimester 3</option><option value="all">All year</option></select></label>
      </div>
      <label className="text-sm font-medium">Document URL<input type="url" value={values.fileUrl} onChange={(event) => set("fileUrl", event.target.value)} className="mt-2 w-full rounded-lg border border-current/15 bg-transparent px-3 py-2.5 text-sm font-normal outline-none focus:border-current/45" /></label>
      <LessonVideoField value={values.youtubeUrl} onChange={(youtubeUrl) => set("youtubeUrl", youtubeUrl)} />
      <button type="submit" disabled={submitting || !validVideo} className="justify-self-start rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black">{submitting ? "Saving…" : submitLabel}</button>
    </form>
  );
}
