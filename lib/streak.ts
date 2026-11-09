const GUEST_KEY = "initium-study-streak";

export type StreakRecord = { lastActive: string; count: number };

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function streakStorageKey(userId?: string | null) {
  return userId ? `${GUEST_KEY}-${userId}` : GUEST_KEY;
}

export function readStreak(userId?: string | null): StreakRecord | null {
  const raw = window.localStorage.getItem(streakStorageKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StreakRecord;
    if (typeof parsed.lastActive === "string" && typeof parsed.count === "number") return parsed;
  } catch {
    window.localStorage.removeItem(streakStorageKey(userId));
  }
  return null;
}

export function writeStreak(record: StreakRecord, userId?: string | null) {
  window.localStorage.setItem(streakStorageKey(userId), JSON.stringify(record));
}

/** Consecutive daily visits. Starts at 0 for a new device. Missing a day resets to 0. */
export function syncStudyStreak(userId?: string | null) {
  const now = new Date();
  const today = localDateKey(now);
  const existing = readStreak(userId) ?? (userId ? readStreak(null) : null);

  if (!existing) {
    const record = { lastActive: today, count: 0 };
    writeStreak(record, userId);
    return record.count;
  }

  if (existing.lastActive === today) return existing.count;

  const previous = parseKey(existing.lastActive);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const count = isSameDay(previous, yesterday) ? existing.count + 1 : 0;
  const record = { lastActive: today, count };
  writeStreak(record, userId);
  return count;
}
