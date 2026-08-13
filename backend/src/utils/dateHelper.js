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

module.exports = { toDayKey };
