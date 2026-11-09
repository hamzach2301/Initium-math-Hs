export type ExamEvent = {
  id: string;
  title: string;
  ar: string;
  start: string;
  end: string;
  allDay?: boolean;
  details: string;
  arDetails: string;
};

export const schoolLocation = "National Mathematical High School of Algiers";

export const examEvents: ExamEvent[] = [
  {
    id: "t1-2026",
    title: "Trimester 1 examinations",
    ar: "اختبارات الفصل الأول",
    start: "2026-12-06",
    end: "2026-12-18",
    allDay: true,
    details: "End of Trimester 1 written examinations across all 1AS mathematics subjects.",
    arDetails: "الاختبارات الكتابية لنهاية الفصل الأول لجميع مواد الأولى ثانوي رياضيات.",
  },
  {
    id: "t2-2027",
    title: "Trimester 2 examinations",
    ar: "اختبارات الفصل الثاني",
    start: "2027-03-08",
    end: "2027-03-20",
    allDay: true,
    details: "End of Trimester 2 written examinations.",
    arDetails: "الاختبارات الكتابية لنهاية الفصل الثاني.",
  },
  {
    id: "bac-blanc-2027",
    title: "Mock BAC (Bac blanc)",
    ar: "البكالوريا البيضاء",
    start: "2027-04-19",
    end: "2027-04-24",
    allDay: true,
    details: "School mock BAC series for mathematics stream students.",
    arDetails: "سلسلة البكالوريا البيضاء لتلاميذ شعبة الرياضيات.",
  },
  {
    id: "bac-2027",
    title: "National BAC examinations",
    ar: "امتحانات البكالوريا الوطنية",
    start: "2027-06-14",
    end: "2027-06-22",
    allDay: true,
    details: "Official BAC calendar window. Confirm the ministry timetable when it is published.",
    arDetails: "نافذة امتحانات البكالوريا الرسمية. أكّد الجدول الوزاري عند نشره.",
  },
];

function compactDate(value: string, endExclusive = false) {
  const date = new Date(`${value}T00:00:00`);
  if (endExclusive) date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function googleCalendarEventUrl(event: ExamEvent, locale: "en" | "ar" = "en") {
  const text = locale === "ar" ? event.ar : event.title;
  const details = locale === "ar" ? event.arDetails : event.details;
  const dates = `${compactDate(event.start)}/${compactDate(event.end, true)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text,
    dates,
    details,
    location: schoolLocation,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export type PersonalCalendarEvent = { title: string; start: string | Date; end: string | Date; description?: string };

/** Google Calendar requires UTC timestamps in YYYYMMDDTHHmmssZ form for timed events. */
export function formatToGCalDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function personalGoogleCalendarUrl(event: PersonalCalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatToGCalDate(event.start)}/${formatToGCalDate(event.end)}`,
    details: event.description ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export const defaultCalendarEmbedSrc =
  "https://calendar.google.com/calendar/embed?src=en.dz%23holiday%40group.v.calendar.google.com&ctz=Africa/Algiers&mode=MONTH&showTitle=0&showPrint=0&showTz=0&wkst=7";

export function calendarEmbedSrc() {
  return process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_SRC || defaultCalendarEmbedSrc;
}
