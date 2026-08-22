/**
 * Normalizes any Date/date-string to UTC midnight so two requests for "the same day"
 * always collide on the same stored value. Matters because MenstrualRecord enforces
 * one document per (userId, date) — without this, a date sent with a time component
 * could silently create a duplicate "day".
 */
function toDayKey(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Whole-day difference between two dates. Safe on already-UTC-midnight values (see toDayKey) — no DST drift. */
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/**
 * Whether `date` and `today` fall in the same calendar month/year — always compared in
 * UTC (via toDayKey), so this doesn't depend on the server's local timezone. Mirrors
 * mobile-app's utils/date.ts isSameMonth (same name, same semantics).
 */
function isSameMonth(date, today) {
  const d = toDayKey(date);
  const t = toDayKey(today);
  return d.getUTCFullYear() === t.getUTCFullYear() && d.getUTCMonth() === t.getUTCMonth();
}

/**
 * Whether `date`'s calendar month/year is strictly before `today`'s. Mirrors
 * mobile-app's utils/date.ts isPastMonth (same name, same semantics).
 */
function isPastMonth(date, today) {
  const d = toDayKey(date);
  const t = toDayKey(today);
  if (d.getUTCFullYear() !== t.getUTCFullYear()) return d.getUTCFullYear() < t.getUTCFullYear();
  return d.getUTCMonth() < t.getUTCMonth();
}

/**
 * Route/query params (unlike request bodies) don't go through the Zod `validate`
 * middleware — `:date` in a URL and `?from=`/`?to=` are always strings, so there's no
 * schema to parse against. Without this check, a garbage value silently becomes
 * JavaScript's `Invalid Date` inside toDayKey() rather than a clear 400 — Mongo then
 * just matches nothing instead of erroring, which reads as "the record doesn't exist"
 * rather than "the date you sent was malformed".
 */
function isValidDateString(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

module.exports = { toDayKey, daysBetween, isValidDateString, isSameMonth, isPastMonth };
