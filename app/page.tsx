"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Check, Clock3, Plus, Pencil, Trash2, LogIn, LogOut, UserRound,
  Target, TrendingUp, Zap,
} from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { usePreferences } from "../components/AppPreferences";
import { dailyQuote, dailyQuotes } from "../lib/dailyMotivation";
import { subjects } from "../lib/subjects";
import { supabase } from "../lib/supabase/client";
import { syncStudyStreak } from "../lib/streak";

type Status = "done" | "progress" | "todo";
type Task = { id: string; title: string; ar: string; subject: string; status: Status; custom?: boolean; suggested?: boolean; materialId?: string | null };
type MagicLinkStatus = "idle" | "loading" | "sent" | "error";

const copy = {
  en: {
    dashboard: "Dashboard", tracker: "Progress Tracker",
    greeting: "Build your mathematical rhythm.",
    subheading: "A focused academic space for the students of the National Mathematical High School.",
    continue: "Continue studying", viewAll: "View all",
    progress: "Your progress", progressSub: "Keep a quiet record of your work. Sign in to keep it with your account.",
    completed: "Completed tasks", available: "Available", active: "In progress", streak: "Study streak",
    days: "days", subjects: "Subject progress", checklist: "Your checklist", status: "Status",
    done: "Completed", inProgress: "In progress (tasks)", notStarted: "Not started", updated: "Saved to your account",
    start: "Start a study session", footer: "Built for the National Mathematical High School of Algiers.", addTask: "Add new task", taskPlaceholder: "e.g. Solve 2023 BAC Physics Exercise 3", selectSubject: "Select subject", save: "Save", cancel: "Cancel", edit: "Edit task", delete: "Delete task", customTask: "Custom task", signIn: "Sign in", signOut: "Sign out", email: "School email", sendLink: "Send magic link", sendingLink: "Sending…", authHint: "Sign in to sync your progress across devices.", magicLinkSent: "Check your inbox! Magic link sent to", syncReady: "Synced securely", academicCalendar: "Academic calendar & exam dates", calendarHint: "The school calendar source can be configured when it is published.", addToCalendar: "Add to Google Calendar", drive: "Google Drive library", finalRevision: "Final Revision", motivation: "Daily motivation",
    items: "items", focused: "Keep going and stay focused.", addSubject: "Add subject", allSubjectsAdded: "All optional subjects added",
  },
  ar: {
    dashboard: "الرئيسية", tracker: "متابعة التقدم",
    greeting: "ابنِ إيقاعك الرياضي.",
    subheading: "مساحة أكاديمية مركّزة لتلاميذ الثانوية الوطنية للرياضيات.",
    progress: "تقدمك", progressSub: "سجل عملك بهدوء. سجّل الدخول لحفظه في حسابك.",
    completed: "مكتمل", available: "متاح", active: "قيد الإنجاز", streak: "سلسلة الدراسة",
    days: "أيام", subjects: "التقدم حسب المادة", checklist: "قائمة مهامك", status: "الحالة",
    done: "مكتمل", inProgress: "قيد الإنجاز", notStarted: "لم يبدأ", updated: "محفوظ في حسابك",
    start: "ابدأ جلسة دراسة", footer: "صُمم لطلاب الثانوية الوطنية للرياضيات بالجزائر.", addTask: "أضف مهمة جديدة", taskPlaceholder: "مثال: حل التمرين الثالث بكالوريا في الفيزياء 2023", selectSubject: "اختر المادة", save: "حفظ", cancel: "إلغاء", edit: "تعديل المهمة", delete: "حذف المهمة", customTask: "مهمة مخصصة", signIn: "تسجيل الدخول", signOut: "تسجيل الخروج", email: "البريد المدرسي", sendLink: "أرسل رابط الدخول", sendingLink: "جارٍ الإرسال…", authHint: "سجل الدخول لمزامنة تقدمك بين الأجهزة.", magicLinkSent: "تحقق من بريدك الوارد! تم إرسال رابط الدخول إلى", syncReady: "متزامن بأمان", academicCalendar: "التقويم الأكاديمي ومواعيد الاختبارات", calendarHint: "يمكن إعداد مصدر تقويم المدرسة عند نشره.", addToCalendar: "أضف إلى تقويم Google", drive: "مكتبة Google Drive", finalRevision: "المراجعة النهائية", motivation: "تحفيز يومي",
    level: "الأولى ثانوي رياضيات", items: "عناصر",focused: "واصل التقدم وحافظ على تركيزك.", addSubject: "أضف مادة", allSubjectsAdded: "تمت إضافة كل المواد الاختيارية",
  },
} as const;

const optionalTrackerSlugs = ["philo", "music", "drawing"] as const;
const coreTrackerSubjects = subjects.filter((subject) => !optionalTrackerSlugs.includes(subject.slug as (typeof optionalTrackerSlugs)[number]));

const initialTasks: Task[] = coreTrackerSubjects.map((subject, index) => ({
  id: `default-${subject.slug}`,
  title: `Review ${subject.name} fundamentals`,
  ar: `مراجعة أساسيات ${subject.ar}`,
  subject: subject.name,
  status: index === 0 ? "progress" : "todo",
  suggested: true,
}));

function deduplicateTasks(taskList: Task[]): Task[] {
  const seen = new Set<string>();

  return taskList.filter((task) => {
    const key = task.custom
      ? `custom-${task.id}`
      : `default-${task.subject}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function readLegacyTasks(): Task[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem("initium-progress") ?? "[]") as Task[];
    const officialNames = new Set(subjects.map((subject) => subject.name));
    return deduplicateTasks(parsed.filter((task) => officialNames.has(task.subject) && typeof task.title === "string" && typeof task.ar === "string"));
  } catch {
    window.localStorage.removeItem("initium-progress");
    return [];
  }
}


export default function Home() {
  const { locale, dark, toggleLocale, toggleDark } = usePreferences();
  const [tasks, setTasks] = useState(initialTasks);
  const [optionalSubjectSlugs, setOptionalSubjectSlugs] = useState<string[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState(subjects[0].name);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [magicLinkStatus, setMagicLinkStatus] = useState<MagicLinkStatus>("idle");
  const [magicLinkError, setMagicLinkError] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [streak, setStreak] = useState(0);
  const [todayLabel, setTodayLabel] = useState("");
  const [motivation, setMotivation] = useState(dailyQuotes[0]);
  const t = copy[locale];
  const isAr = locale === "ar";
  const trackedSubjects = useMemo(
    () => [...coreTrackerSubjects, ...subjects.filter((subject) => optionalSubjectSlugs.includes(subject.slug))],
    [optionalSubjectSlugs],
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("initium-optional-tracker-subjects") ?? "[]") as unknown;
      if (Array.isArray(saved)) setOptionalSubjectSlugs(saved.filter((slug): slug is string => typeof slug === "string" && optionalTrackerSlugs.includes(slug as (typeof optionalTrackerSlugs)[number])));
    } catch {
      window.localStorage.removeItem("initium-optional-tracker-subjects");
    }
  }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setTodayLabel(new Intl.DateTimeFormat(isAr ? "ar-DZ" : "en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date()));
  }, [isAr]);

  useEffect(() => { setMotivation(dailyQuote()); }, []);

  useEffect(() => {
    setStreak(syncStudyStreak(user?.id));
  }, [user]);

  useEffect(() => {
    if (!user || !supabase) { setRemoteReady(false); setTasks(initialTasks); return; }
    const client = supabase;
    let cancelled = false;
    const loadRemoteTasks = async () => {
      setRemoteReady(false);
      setTrackerError(null);
      const [{ data, error }, { data: settings, error: settingsError }] = await Promise.all([
        client.from("tracker_tasks").select("id, subject, title, ar_title, status, custom, suggested, material_id").order("created_at"),
        client.from("student_tracker_settings").select("initialized").maybeSingle(),
      ]);
      if (cancelled) return;
      if (error || settingsError) { setTrackerError(error?.message ?? settingsError?.message ?? "Could not load your tracker."); return; }
      let rows = data ?? [];
      if (!rows.length && !settings?.initialized) {
        const legacy = readLegacyTasks();
        const seed = deduplicateTasks(legacy.length ? legacy : initialTasks);
        const { error: seedError } = await client.from("tracker_tasks").insert(seed.map(({ subject, title, ar, status, custom, suggested, materialId }) => ({ subject, title, ar_title: ar, status, custom: Boolean(custom), suggested: Boolean(suggested ?? !custom), material_id: materialId ?? null })));
        if (seedError) { setTrackerError(seedError.message); return; }
        const { data: seeded, error: seededError } = await client.from("tracker_tasks").select("id, subject, title, ar_title, status, custom, suggested, material_id").order("created_at");
        if (seededError) { setTrackerError(seededError.message); return; }
        rows = seeded ?? [];
        window.localStorage.removeItem("initium-progress");
      }
      const { error: settingsWriteError } = await client.from("student_tracker_settings").upsert({ user_id: user.id, initialized: true });
      if (settingsWriteError) { setTrackerError(settingsWriteError.message); return; }
      if (!cancelled) {
        const optionalFromRemote = subjects.filter((subject) => optionalTrackerSlugs.includes(subject.slug as (typeof optionalTrackerSlugs)[number]) && rows.some((task) => task.subject === subject.name)).map((subject) => subject.slug);
        if (optionalFromRemote.length) {
          setOptionalSubjectSlugs(optionalFromRemote);
          window.localStorage.setItem("initium-optional-tracker-subjects", JSON.stringify(optionalFromRemote));
        }
        setTasks(rows.map((task) => ({ id: task.id, subject: task.subject, title: task.title, ar: task.ar_title, status: task.status as Status, custom: task.custom, suggested: task.suggested, materialId: task.material_id })));
      }
      if (!cancelled) setRemoteReady(true);
    };
    loadRemoteTasks();
    return () => { cancelled = true; };
  }, [user]);

  const completed = tasks.filter((task) => task.status === "done").length;
  const subjectProgress = useMemo(() => trackedSubjects.map((subject) => {
    const items = tasks.filter((task) => task.subject === subject.name);
    return {
      ...subject,
      percent: items.length === 0
        ? 0
        : Math.round((items.filter((item) => item.status === "done").length / items.length) * 100),
    };
  }), [tasks, trackedSubjects]);
  const persistTask = async (task: Task, previous: Task) => {
    if (!user || !remoteReady || !supabase) return;
    const { error } = await supabase.from("tracker_tasks").update({ subject: task.subject, title: task.title, ar_title: task.ar, status: task.status, custom: Boolean(task.custom), suggested: Boolean(task.suggested), material_id: task.materialId ?? null }).eq("id", task.id);
    if (error) { setTrackerError(error.message); setTasks((current) => current.map((item) => item.id === previous.id ? previous : item)); }
  };
  const updateTask = (id: string, change: (task: Task) => Task) => {
    if (!user || !remoteReady || !supabase) { setTrackerError("Sign in before updating tasks so your progress is saved to your account."); return; }
    const previous = tasks.find((task) => task.id === id);
    if (!previous) return;
    const updated = change(previous);
    setTasks((current) => current.map((task) => task.id === id ? updated : task));
    void persistTask(updated, previous);
  };
  const toggleTask = (id: string) => updateTask(id, (task) => ({ ...task, status: task.status === "done" ? "todo" : "done" }));
  const moveTask = (id: string) => updateTask(id, (task) => ({ ...task, status: task.status === "progress" ? "done" : "progress" }));
  const addOptionalSubject = (slug: string) => {
    const subject = subjects.find((item) => item.slug === slug);
    if (!subject || optionalSubjectSlugs.includes(slug)) return;
    const nextOptionalSlugs = [...optionalSubjectSlugs, slug];
    setOptionalSubjectSlugs(nextOptionalSlugs);
    window.localStorage.setItem("initium-optional-tracker-subjects", JSON.stringify(nextOptionalSlugs));

    const task: Task = {
      id: crypto.randomUUID(),
      title: `Review ${subject.name} fundamentals`,
      ar: `مراجعة أساسيات ${subject.ar}`,
      subject: subject.name,
      status: "todo",
      suggested: true,
    };
    setTasks((current) => current.some((item) => item.subject === subject.name) ? current : [...current, task]);
    if (user && remoteReady && supabase) {
      void supabase.from("tracker_tasks").insert({ id: task.id, subject: task.subject, title: task.title, ar_title: task.ar, status: task.status, custom: false, suggested: true });
    }
  };
  const removeOptionalSubject = (slug: string) => {
    const subject = subjects.find((item) => item.slug === slug);
    if (!subject || !optionalSubjectSlugs.includes(slug)) return;
    const nextOptionalSlugs = optionalSubjectSlugs.filter((item) => item !== slug);
    setOptionalSubjectSlugs(nextOptionalSlugs);
    window.localStorage.setItem("initium-optional-tracker-subjects", JSON.stringify(nextOptionalSlugs));
    if (newTaskSubject === subject.name) setNewTaskSubject(coreTrackerSubjects[0]?.name ?? "");
    const removedTasks = tasks.filter((task) => task.subject === subject.name);
    setTasks((current) => current.filter((task) => task.subject !== subject.name));
    if (user && remoteReady && supabase && removedTasks.length) {
      void supabase.from("tracker_tasks").delete().eq("subject", subject.name).then(({ error }) => {
        if (error) {
          setTrackerError(error.message);
          setOptionalSubjectSlugs(optionalSubjectSlugs);
          window.localStorage.setItem("initium-optional-tracker-subjects", JSON.stringify(optionalSubjectSlugs));
          setTasks((current) => [...current, ...removedTasks]);
        }
      });
    }
  };
  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    if (!user || !remoteReady || !supabase) { setTrackerError("Sign in before adding tasks so they are saved to your account."); return; }
    const task = { id: crypto.randomUUID(), title, ar: title, subject: newTaskSubject, status: "todo" as Status, custom: true, suggested: false };
    setTasks((current) => [...current, task]);
    setNewTask("");
    void supabase.from("tracker_tasks").insert({ id: task.id, subject: task.subject, title: task.title, ar_title: task.ar, status: task.status, custom: true, suggested: false }).then(({ error }) => { if (error) { setTrackerError(error.message); setTasks((current) => current.filter((item) => item.id !== task.id)); } });
  };
  const saveEdit = (id: string) => {
    const title = editingText.trim();
    if (title) updateTask(id, (task) => ({ ...task, title, ar: title }));
    setEditingId(null);
  };
  const deleteTask = (id: string) => {
    if (!user || !remoteReady || !supabase) return;
    const deleted = tasks.find((task) => task.id === id);
    if (!deleted) return;
    setTasks((current) => current.filter((task) => task.id !== id));
    void supabase.from("tracker_tasks").delete().eq("id", id).then(({ error }) => { if (error) { setTrackerError(error.message); setTasks((current) => [...current, deleted]); } });
  };
  const sendMagicLink = async () => {
    const recipient = email.trim().toLowerCase();
    if (!recipient || !/^\S+@\S+\.\S+$/.test(recipient)) { setMagicLinkStatus("error"); setMagicLinkError("Enter a valid email address."); return; }
    if (!supabase) { setMagicLinkStatus("error"); setMagicLinkError("Sign-in is not configured yet."); return; }
    setMagicLinkStatus("loading");
    setMagicLinkError("");
    const { error } = await supabase.auth.signInWithOtp({ email: recipient, options: { emailRedirectTo: `${window.location.origin}/` } });
    if (error) { setMagicLinkStatus("error"); setMagicLinkError(error.message); return; }
    setSentEmail(recipient);
    setMagicLinkStatus("sent");
  };
  const signOut = async () => { await supabase?.auth.signOut(); setAuthOpen(false); };

  return (
    <main dir={isAr ? "rtl" : "ltr"} className={`${dark ? "dark" : ""} app-shell min-h-screen`}>
      <SiteHeader
        arabic={isAr}
        dark={dark}
        onToggleArabic={toggleLocale}
        onToggleDark={toggleDark}
        extra={user
          ? <button onClick={signOut} title={t.signOut} className={`flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-semibold ${dark ? "border-white/15" : "border-black/10"}`}><LogOut size={14}/>{t.signOut}</button>
          : <div className="flex items-center gap-2"><button onClick={() => { setAuthOpen(!authOpen); setMagicLinkStatus("idle"); setMagicLinkError(""); }} className={`flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-semibold ${dark ? "border-white/15" : "border-black/10"}`}><LogIn size={14}/>{t.signIn}</button></div>}
      />

      {authOpen && !user && <div className={`fixed inset-x-0 top-[72px] z-20 border-b ${dark ? "border-white/10 bg-[#151515]" : "border-black/10 bg-[#f8f8f6]"}`}><div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">{magicLinkStatus === "sent" ? <div className="flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400"><UserRound size={17}/><p>{t.magicLinkSent} <strong>{sentEmail}</strong></p></div> : <form onSubmit={(event) => { event.preventDefault(); sendMagicLink(); }} className="flex flex-col gap-3 sm:flex-row sm:items-center"><UserRound size={17} className="shrink-0 text-current/55"/><p className="text-sm text-current/60 sm:mr-auto">{t.authHint}</p><input disabled={magicLinkStatus === "loading"} type="email" required value={email} onChange={(event) => { setEmail(event.target.value); if (magicLinkStatus === "error") setMagicLinkStatus("idle"); }} placeholder={t.email} className={`rounded-lg border bg-transparent px-3 py-2 text-sm outline-none disabled:cursor-wait disabled:opacity-60 ${dark ? "border-white/15" : "border-black/15"}`}/><button disabled={magicLinkStatus === "loading"} className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-black">{magicLinkStatus === "loading" ? t.sendingLink : t.sendLink}</button>{magicLinkStatus === "error" && <p className="text-xs text-red-600 dark:text-red-400">{magicLinkError}</p>}</form>}</div></div>}

      <section id="dashboard" className="mx-auto w-full max-w-[1240px] px-5 pb-16 pt-16 lg:px-8 lg:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div><p className="mb-4 flex items-center gap-2 text-sm text-current/45"><span className="h-px w-7 bg-current/40" /> {todayLabel}</p><h1 className="max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-[-0.055em] sm:text-5xl lg:text-[64px]">{t.greeting}</h1><p className="mt-6 max-w-lg text-balance text-base leading-7 text-current/55">{t.subheading}</p></div>
          <div className={`rounded-2xl border border-[#93a9d8]/30 bg-[#eef2fb]/70 px-6 py-5 shadow-[0_10px_30px_rgba(78,109,186,0.08)] dark:border-[#93a9d8]/30 dark:bg-[#93a9d8]/[.08] ${isAr ? "border-r-2" : "border-l-2"}`}><p className="text-xs font-medium uppercase tracking-[.15em] text-current/40">{t.motivation}</p><blockquote className="mt-2 text-lg font-medium leading-7 tracking-[-.03em]">“{isAr ? motivation.ar : motivation.text}”</blockquote><p className="mt-2 text-sm text-current/50">— {motivation.author}</p></div>
        </div>
        <div className="mt-16 grid gap-3 sm:grid-cols-3">
          {[{ icon: Check, value: `${completed}/${tasks.length}`, label: t.completed }, { icon: Target, value: `${tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%`, label: t.active }, { icon: Zap, value: String(streak).padStart(2, "0"), label: t.streak }].map(({ icon: Icon, value, label }) => <div className={`rounded-2xl border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] sm:p-6 ${dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.08] bg-white"}`} key={label}><Icon size={18} className="mb-8 text-current/45" strokeWidth={1.5}/><p className="text-3xl font-medium tracking-[-.06em]">{value}</p><p className="mt-1 text-sm text-current/50">{label}{label === t.streak && ` · ${t.days}`}</p></div>)}
        </div>
      </section>

      <section id="tracker" className={`scroll-mt-16 py-16 lg:py-24 ${dark ? "bg-[#111111]" : "bg-[#f0f1ed]"}`}><div className="mx-auto w-full max-w-[1240px] px-5 lg:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-medium uppercase tracking-[.15em] text-current/40">02 / {t.tracker}</p><h2 className="text-3xl font-medium tracking-[-.05em] sm:text-4xl">{t.progress}</h2><p className="mt-3 text-sm text-current/55">{t.progressSub}</p></div><p className="flex items-center gap-2 text-xs text-current/45"><Clock3 size={14}/>{t.updated}</p></div>
        <div className="mt-10 grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><div className={`rounded-2xl border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] sm:p-6 ${dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.07] bg-white"}`}><div className="mb-5 flex items-center justify-between gap-3"><h3 className="text-sm font-medium">{t.subjects}</h3><span className="text-xs text-current/45">{subjectProgress.length} / {subjects.length}</span></div><div className="space-y-6">{subjectProgress.map((subject) => <div key={subject.name}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><div className="flex min-w-0 items-center gap-2"><span className="truncate">{isAr ? subject.ar : subject.name}</span>{optionalTrackerSlugs.includes(subject.slug as (typeof optionalTrackerSlugs)[number]) && <button type="button" onClick={() => removeOptionalSubject(subject.slug)} className="shrink-0 text-[11px] text-current/40 underline underline-offset-2 transition hover:text-red-500" aria-label={isAr ? `إزالة ${subject.ar}` : `Remove ${subject.name}`}>{isAr ? "إزالة" : "Remove"}</button>}</div><span className="shrink-0 text-current/45">{subject.percent}%</span></div><div className={`h-2 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`}><div className="h-full rounded-full bg-[#4e6dba] transition-all duration-500" style={{ width: `${subject.percent}%` }}/></div></div>)}</div><div className={`mt-6 rounded-xl border p-4 ${dark ? "border-white/10 bg-white/[.03]" : "border-black/[.07] bg-[#fafaf7]"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-current/55">{optionalSubjectSlugs.length < optionalTrackerSlugs.length ? t.addSubject : t.allSubjectsAdded}</p>{optionalSubjectSlugs.length < optionalTrackerSlugs.length && <select value="" onChange={(event) => event.target.value && addOptionalSubject(event.target.value)} className={`rounded-lg border bg-transparent px-3 py-2 text-xs outline-none ${dark ? "border-white/10" : "border-black/10"}`}><option value="">{t.addSubject}</option>{subjects.filter((subject) => optionalTrackerSlugs.includes(subject.slug as (typeof optionalTrackerSlugs)[number]) && !optionalSubjectSlugs.includes(subject.slug)).map((subject) => <option value={subject.slug} key={subject.slug}>{isAr ? subject.ar : subject.name}</option>)}</select>}</div></div><div className={`mt-10 rounded-xl border p-5 ${dark ? "border-white/10 bg-white/[.03]" : "border-black/[.07] bg-[#fafaf7]"}`}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#ede2b5] text-[#7a5c16]"><TrendingUp size={18}/></span><div><p className="font-medium">{t.streak}: {streak} {t.days}</p><p className="text-xs text-current/50">{t.focused}</p></div></div></div></div>
          <div className={`rounded-2xl border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] sm:p-6 ${dark ? "border-white/10 bg-[#1b1b1b] shadow-black/20" : "border-black/[.07] bg-white"}`}><div className="mb-5 flex items-center justify-between"><h3 className="text-sm font-medium">{t.checklist}</h3><span className="text-xs text-current/45">{completed} {t.done}</span></div>
            <div className={`mb-4 rounded-xl border p-3 ${dark ? "border-white/10 bg-white/[.03]" : "border-black/[.07] bg-[#fafaf7]"}`}><p className="mb-3 text-xs font-medium text-current/55">{t.addTask}</p><div className="flex flex-col gap-2 md:flex-row"><input value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTask()} placeholder={t.taskPlaceholder} className={`min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-current/35 ${dark ? "border-white/10" : "border-black/10"}`}/><select value={newTaskSubject} onChange={(event) => setNewTaskSubject(event.target.value)} className={`rounded-lg border bg-transparent px-3 py-2 text-sm outline-none ${dark ? "border-white/10" : "border-black/10"}`}>{trackedSubjects.map((subject) => <option className="text-black" value={subject.name} key={subject.slug}>{isAr ? subject.ar : subject.name}</option>)}</select><button onClick={addTask} className="flex items-center justify-center gap-1 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"><Plus size={15}/>{t.addTask}</button></div>{trackerError && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{trackerError}</p>}</div>
            <div className={`overflow-hidden rounded-xl border ${dark ? "border-white/10" : "border-black/[.07]"}`}>{trackedSubjects.map((subject) => <div key={subject.slug} className={`${dark ? "border-white/10" : "border-black/10"} border-b last:border-b-0`}><div className={`${dark ? "bg-white/[.04]" : "bg-black/[.025]"} px-4 py-2 text-xs font-medium text-current/55`}>{isAr ? subject.ar : subject.name}</div>{tasks.filter((task) => task.subject === subject.name).map((task) => <div key={task.id} className={`flex flex-col gap-3 p-4 transition hover:bg-black/[.02] sm:flex-row sm:items-center ${dark ? "border-white/10 hover:bg-white/[.03]" : "border-black/10"} border-t`}><div className="flex min-w-0 flex-1 items-center gap-3"><button onClick={() => toggleTask(task.id)} aria-label={`Mark ${task.title}`} className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${task.status === "done" ? "border-black bg-black text-white" : dark ? "border-white/30" : "border-black/25"}`}>{task.status === "done" && <Check size={13} strokeWidth={2.5}/>}</button><div className="min-w-0 flex-1">{editingId === task.id ? <input autoFocus value={editingText} onChange={(event) => setEditingText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && saveEdit(task.id)} className={`w-full rounded border bg-transparent px-2 py-1 text-sm outline-none ${dark ? "border-white/15" : "border-black/15"}`}/> : <><p className={`truncate text-sm font-medium ${task.status === "done" ? "text-current/40 line-through" : ""}`}>{task.custom ? task.title : (isAr ? task.ar : task.title)}</p>{task.custom && <p className="mt-1 text-xs text-current/42">{t.customTask}</p>}</>}</div></div><div className="flex flex-wrap items-center gap-2 sm:shrink-0"><button onClick={() => moveTask(task.id)} className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition hover:brightness-95 ${task.status === "done" ? "bg-[#e0eee6] text-[#3b7653]" : task.status === "progress" ? "bg-[#e4eafb] text-[#4664ad]" : dark ? "bg-white/10 text-white/60" : "bg-black/5 text-black/50"}`}>{task.status === "done" ? t.done : task.status === "progress" ? t.inProgress : t.notStarted}</button>{user && remoteReady && <>{editingId === task.id ? <button onClick={() => saveEdit(task.id)} aria-label={t.save} className="grid h-7 w-7 place-items-center text-[#3b7653]"><Check size={15}/></button> : <button onClick={() => { setEditingId(task.id); setEditingText(task.title); }} aria-label={t.edit} className="grid h-7 w-7 place-items-center text-current/45"><Pencil size={14}/></button>}<button onClick={() => deleteTask(task.id)} aria-label={t.delete} className="grid h-7 w-7 place-items-center text-current/45 hover:text-red-600"><Trash2 size={14}/></button></>}</div></div>)}</div>)}</div></div></div>
      </div></section>
      <footer className={`border-t ${dark ? "border-white/10" : "border-black/10"}`}><div className="mx-auto max-w-7xl px-5 py-7 text-center text-xs text-current/45 lg:px-8">© 2026 Initium Math.HS · Built for the National Mathematical High School of Algiers · made by hamzach/aminbr</div></footer>
    </main>
  );
}
