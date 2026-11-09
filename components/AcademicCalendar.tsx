"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CalendarDays, ExternalLink, Plus, Trash2 } from "lucide-react";
import { calendarEmbedSrc, examEvents, googleCalendarEventUrl, personalGoogleCalendarUrl } from "../lib/calendar";
import { supabase } from "../lib/supabase/client";

type EventType = "study" | "exam" | "task";
type StudentEvent = { id: string; title: string; event_date: string; type: EventType };
const localKey = (userId?: string) => "initium-student-events-" + (userId ?? "offline");

export function AcademicCalendar({ arabic, dark }: { arabic: boolean; dark?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<StudentEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [remoteAvailable, setRemoteAvailable] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<EventType>("study");
  const surface = dark ? "border-white/10 bg-white/[.03]" : "border-black/10 bg-white";
  const labels = arabic ? { heading: "التقويم الأكاديمي ومواعيد الاختبارات", subtitle: "أضف خطتك الدراسية ومواعيدك الخاصة؛ تُحفظ لك وحدك.", newEvent: "حدث جديد", title: "العنوان", date: "التاريخ", type: "النوع", study: "مذاكرة", exam: "اختبار", task: "مهمة", add: "إضافة", personal: "مواعيدي الخاصة", empty: "لا توجد مواعيد خاصة بعد." } : { heading: "Academic calendar & exam dates", subtitle: "Add personal study plans and dates; they are saved only for you.", newEvent: "New event", title: "Title", date: "Date", type: "Type", study: "Study session", exam: "Exam date", task: "Task", add: "Add event", personal: "My personal events", empty: "No personal events yet." };

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const load = async () => {
      if (user && supabase) {
        const { data, error } = await supabase.from("student_events").select("id, title, event_date, type").order("event_date");
        if (!cancelled && !error) { setEvents((data ?? []) as StudentEvent[]); setRemoteAvailable(true); setReady(true); return; }
      }
      if (!cancelled) {
        try { setEvents(JSON.parse(window.localStorage.getItem(localKey(user?.id)) ?? "[]") as StudentEvent[]); } catch { setEvents([]); }
        setRemoteAvailable(false); setReady(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);
  useEffect(() => { if (ready && !remoteAvailable) window.localStorage.setItem(localKey(user?.id), JSON.stringify(events)); }, [events, ready, remoteAvailable, user]);

  const addEvent = async (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !date) return;
    const item: StudentEvent = { id: crypto.randomUUID(), title: cleanTitle, event_date: date, type };
    setEvents((current) => [...current, item].sort((a, b) => a.event_date.localeCompare(b.event_date)));
    setTitle("");
    if (user && supabase && remoteAvailable) { const { error } = await supabase.from("student_events").insert(item); if (error) setRemoteAvailable(false); }
  };
  const deleteEvent = async (id: string) => {
    setEvents((current) => current.filter((event) => event.id !== id));
    if (user && supabase && remoteAvailable) { const { error } = await supabase.from("student_events").delete().eq("id", id); if (error) setRemoteAvailable(false); }
  };
  const typeLabel = (value: EventType) => value === "study" ? labels.study : value === "exam" ? labels.exam : labels.task;
  const personalEventUrl = (event: StudentEvent) => personalGoogleCalendarUrl({
    title: event.title,
    start: `${event.event_date}T09:00:00Z`,
    end: `${event.event_date}T10:00:00Z`,
    description: `${typeLabel(event.type)} · Initium Math.HS`,
  });

  return <section id="calendar" className="scroll-mt-20">
    <div><p className="mb-3 text-xs font-medium uppercase tracking-[.15em] text-current/40">03 / {arabic ? "التقويم" : "Calendar"}</p><h2 className="text-3xl font-medium tracking-[-.05em] sm:text-4xl">{labels.heading}</h2><p className="mt-3 max-w-xl text-sm text-current/55">{labels.subtitle}</p></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><div className={"overflow-hidden rounded-xl border " + surface}><iframe title={arabic ? "جدول المدرسة" : "School schedule"} src={calendarEmbedSrc()} width="100%" height="520" className="block min-h-[360px] w-full sm:min-h-[520px]" style={{ border: 0 }} /></div><div className="space-y-3">{examEvents.map((event) => <article key={event.id} className={"rounded-xl border p-4 sm:p-5 " + surface}><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e7edff] text-[#355fb5]"><CalendarDays size={16}/></span><div className="min-w-0 flex-1"><h3 className="font-medium">{arabic ? event.ar : event.title}</h3><p className="mt-1 text-xs text-current/50">{event.start} → {event.end}</p><a href={googleCalendarEventUrl(event, arabic ? "ar" : "en")} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm underline underline-offset-4">{arabic ? "أضف إلى تقويم Google" : "Add to Google Calendar"}<ExternalLink size={14}/></a></div></div></article>)}</div></div>
    <div className={"mt-6 rounded-xl border p-4 sm:p-5 " + surface}><div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]"><form onSubmit={addEvent}><h3 className="text-base font-medium">{labels.newEvent}</h3><div className="mt-4 grid gap-2 sm:grid-cols-2"><input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={180} placeholder={labels.title} className="min-w-0 rounded-lg border border-current/15 bg-transparent px-3 py-2 text-sm outline-none"/><input value={date} onChange={(event) => setDate(event.target.value)} required type="date" className="rounded-lg border border-current/15 bg-transparent px-3 py-2 text-sm outline-none"/><select value={type} onChange={(event) => setType(event.target.value as EventType)} className="rounded-lg border border-current/15 bg-transparent px-3 py-2 text-sm outline-none"><option value="study">{labels.study}</option><option value="exam">{labels.exam}</option><option value="task">{labels.task}</option></select><button className="flex items-center justify-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"><Plus size={15}/>{labels.add}</button></div></form><div><h3 className="text-base font-medium">{labels.personal}</h3>{!ready ? <p className="mt-4 text-sm text-current/45">Loading…</p> : events.length ? <div className="mt-3 space-y-2">{events.map((event) => <div key={event.id} className="flex items-center gap-3 rounded-lg border border-current/10 px-3 py-2"><CalendarDays size={15} className="shrink-0 text-current/45"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{event.title}</p><p className="text-xs text-current/45">{event.event_date} · {typeLabel(event.type)}</p></div><a href={personalEventUrl(event)} target="_blank" rel="noreferrer" aria-label={arabic ? "أضف إلى تقويم Google" : "Add to Google Calendar"} className="grid h-8 w-8 place-items-center rounded-full text-current/45 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"><ExternalLink size={15}/></a><button type="button" onClick={() => deleteEvent(event.id)} aria-label={arabic ? "حذف الحدث" : "Delete event"} className="grid h-8 w-8 place-items-center rounded-full text-current/45 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={15}/></button></div>)}</div> : <p className="mt-4 text-sm text-current/45">{labels.empty}</p>}</div></div></div>
  </section>;
}
