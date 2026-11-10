import i18n from '@/i18n';

const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
// Khmer month names have no common abbreviations, so short and long are the same.
const MONTHS_KM = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
// Sunday-first, same as getMonthGrid: អាទិត្យ ចន្ទ អង្គារ ពុធ ព្រហស្បតិ៍ សុក្រ សៅរ៍
const WEEKDAYS_KM = ['អា', 'ច', 'អ', 'ពុ', 'ព្រ', 'សុ', 'ស'];

const isKhmer = () => i18n.language === 'km';
const monthShort = (m: number) => (isKhmer() ? MONTHS_KM[m] : MONTHS_SHORT_EN[m]);
const monthLong = (m: number) => (isKhmer() ? MONTHS_KM[m] : MONTHS_LONG_EN[m]);

/** One-letter weekday headers for month grids, Sunday first, in the current language. */
export function weekdayLabels(): string[] {
  return isKhmer() ? WEEKDAYS_KM : WEEKDAYS_EN;
}

/** "Jan 5" / "5 មករា" */
export function formatShort(date: Date): string {
  return isKhmer() ? `${date.getDate()} ${monthShort(date.getMonth())}` : `${monthShort(date.getMonth())} ${date.getDate()}`;
}

/** "January 5, 2026" / "5 មករា 2026" */
export function formatLong(date: Date): string {
  return isKhmer()
    ? `${date.getDate()} ${monthLong(date.getMonth())} ${date.getFullYear()}`
    : `${monthLong(date.getMonth())} ${date.getDate()}, ${date.getFullYear()}`;
}

/** "Jan 5–9" / "5–9 មករា", or a full two-date range across months. */
export function formatRange(start: Date, end: Date): string {
  if (start.getMonth() === end.getMonth()) {
    return isKhmer()
      ? `${start.getDate()}–${end.getDate()} ${monthShort(start.getMonth())}`
      : `${monthShort(start.getMonth())} ${start.getDate()}–${end.getDate()}`;
  }
  return `${formatShort(start)} – ${formatShort(end)}`;
}

/** Hour:minute in the current language's style (Khmer has no AM/PM convention in the app, so 24-hour). */
export function formatTime(date: Date): string {
  if (isKhmer()) {
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** A new Date `days` calendar days after `date` (negative goes backward). Never mutates `date`. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Every calendar date from `start` to `end` inclusive, one Date instance per day. */
export function eachDayInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Stable per-calendar-month string key, for grouping recorded days by month. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/**
 * True if `date`'s calendar month/year is strictly before `today`'s — i.e. a month that's
 * already fully happened. Every such month can still have a *new* record backfilled into it
 * (see Calendar's multi-select), just never a future one.
 */
export function isPastMonth(date: Date, today: Date): boolean {
  if (date.getFullYear() !== today.getFullYear()) return date.getFullYear() < today.getFullYear();
  return date.getMonth() < today.getMonth();
}

/** Stable per-calendar-day string key, for indexing per-day records in a map. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * `YYYY-MM-DD` in the device's *local* calendar day — what the backend's `date`/`asOf`
 * query params and request bodies expect (see menstrualValidators.js's `z.iso.date()`).
 * Deliberately not `date.toISOString()` — that converts to UTC first, which can shift
 * the calendar day by one in any timezone behind UTC (e.g. 11pm local on the 10th is
 * already the 11th in UTC).
 */
export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Inverse of `isoDate` — also tolerates a full Mongo/JSON timestamp (e.g.
 * `"2026-07-24T00:00:00.000Z"`, what `GET` endpoints actually return) by only reading
 * its first 10 characters. Builds the `Date` from local Y/M/D components (never
 * `new Date(isoString)` directly) so the same UTC-shift risk `isoDate` avoids on the
 * way out doesn't sneak back in on the way in.
 */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const d = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const s = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const e = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

export function monthLabel(date: Date): string {
  return `${monthLong(date.getMonth())} ${date.getFullYear()}`;
}

/** Time-of-day greeting ("Good morning"/"afternoon"/"evening") based on the device clock. */
export function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return i18n.t('greeting.morning');
  if (hour < 18) return i18n.t('greeting.afternoon');
  return i18n.t('greeting.evening');
}

/** Cells for a month grid, including leading/trailing days from adjacent months. */
export function getMonthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return { date, inMonth: date.getMonth() === month };
  });
}
