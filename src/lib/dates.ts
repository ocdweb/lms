// Pure date helpers — safe to import from client components.
// Date-only values are handled as "YYYY-MM-DD" strings or UTC-midnight Date objects.

export type HolidaySpan = { name: string; start: string; end: string };
export type Duration = "FULL" | "HALF_AM" | "HALF_PM";

const DAY_MS = 86_400_000;
export const WEEKEND_DAYS = [0, 6]; // Sunday, Saturday

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function todayISO(timeZone = "UTC"): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function isWeekend(date: Date): boolean {
  return WEEKEND_DAYS.includes(date.getUTCDay());
}

export function eachDay(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = parseISODate(start); toISODate(d) <= end; d = addDays(d, 1)) out.push(toISODate(d));
  return out;
}

/** Working days between two dates (inclusive), excluding weekends and active holidays. */
export function countLeaveDays(start: string, end: string, duration: Duration, holidays: HolidaySpan[]) {
  if (!start || !end || end < start) return { days: 0, weekendDays: 0, holidayHits: [] as string[] };
  let days = 0;
  let weekendDays = 0;
  const holidayHits = new Set<string>();
  for (const iso of eachDay(start, end)) {
    if (isWeekend(parseISODate(iso))) {
      weekendDays++;
      continue;
    }
    const h = holidays.find((h) => iso >= h.start && iso <= h.end);
    if (h) {
      holidayHits.add(h.name);
      continue;
    }
    days++;
  }
  if (duration !== "FULL" && start === end && days === 1) days = 0.5;
  return { days, weekendDays, holidayHits: [...holidayHits] };
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });
const shortFmt = fmt({ month: "short", day: "2-digit", year: "numeric" });
const monthDayFmt = fmt({ month: "short", day: "2-digit" });
const longFmt = fmt({ month: "long", day: "2-digit", year: "numeric" });

const asDate = (d: Date | string) => (typeof d === "string" ? parseISODate(d.slice(0, 10)) : d);

export const formatDate = (d: Date | string) => shortFmt.format(asDate(d));
export const formatMonthDay = (d: Date | string) => monthDayFmt.format(asDate(d));
export const formatLong = (d: Date | string) => longFmt.format(asDate(d));
export const formatWeekdayLong = (d: Date | string) =>
  fmt({ weekday: "long", month: "long", day: "2-digit", year: "numeric" }).format(asDate(d));
export const monthAbbr = (d: Date | string) => fmt({ month: "short" }).format(asDate(d)).toUpperCase();
export const dayNum = (d: Date | string) => String(asDate(d).getUTCDate()).padStart(2, "0");

export function formatRange(start: Date | string, end: Date | string): string {
  const s = toISODate(asDate(start));
  const e = toISODate(asDate(end));
  return s === e ? formatDate(s) : `${formatDate(s)} → ${formatDate(e)}`;
}

export function formatDays(days: number): string {
  const n = Number.isInteger(days) ? String(days) : days.toFixed(1);
  return `${n} ${days === 1 ? "Day" : "Days"}`;
}

export function formatDateTime(d: Date, timeZone = "UTC"): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" }).format(d);
}
