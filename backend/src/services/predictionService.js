/**
 * Pure date-math cycle predictions — no external calls, so it's cheap to run on every
 * profile/prediction read. Swap the averaging logic here for something smarter (e.g.
 * weighted recent cycles) once there's enough real MenstrualRecord history to justify it.
 */

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function predictNextCycle({ lastPeriodStart, averageCycleLength, averagePeriodLength }) {
  if (!lastPeriodStart) return null;

  const nextPeriodStart = addDays(lastPeriodStart, averageCycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, averagePeriodLength - 1);
  // Ovulation is ~14 days before the *next* period, fertile window is the ~5 days
  // leading up to and including it — matches the home/prediction screens' phase math.
  const fertileWindowStart = addDays(nextPeriodStart, -(averageCycleLength - 11));
  const fertileWindowEnd = addDays(fertileWindowStart, 4);

  return { nextPeriodStart, nextPeriodEnd, fertileWindowStart, fertileWindowEnd };
}

/**
 * Which of the 4 phases `currentCycleDay` falls into — scaled to *this* user's own
 * averageCycleLength/averagePeriodLength instead of assuming a fixed 28-day cycle for
 * everyone. The old fixed thresholds (<=5/<=13/<=16) mislabeled longer/shorter cycles —
 * e.g. Day 17 of a 35-day cycle read as "Luteal" even though ovulation (~day 21) hadn't
 * happened yet.
 *
 * - Menstrual: Day 1 through averagePeriodLength.
 * - Ovulation: a 3-day window centered on the estimated ovulation day
 *   (averageCycleLength - 14 — the same "~14 days before the next period" assumption
 *   predictNextCycle() above uses for fertileWindowStart/End).
 * - Follicular: everything between the end of Menstrual and the start of Ovulation.
 * - Luteal: everything after Ovulation ends, through the end of the cycle.
 *
 * cycleLength is floored at 20 so a corrupt/unrealistic averageCycleLength can't push
 * the ovulation window earlier than Menstrual ends. Matches the equivalent logic in
 * mobile-app's home.tsx (cyclePhase) and prediction.tsx (buildPhases) — keep the three
 * in sync if this formula changes.
 */
function cyclePhase(currentCycleDay, averageCycleLength = 28, averagePeriodLength = 5) {
  const periodLength = Math.max(1, averagePeriodLength);
  const cycleLength = Math.max(20, averageCycleLength);
  const estimatedOvulationDay = cycleLength - 14;

  if (currentCycleDay <= periodLength) return "Menstrual phase";
  if (currentCycleDay < estimatedOvulationDay - 1) return "Follicular phase";
  if (currentCycleDay <= estimatedOvulationDay + 1) return "Ovulation phase";
  return "Luteal phase";
}

function currentCycleDay(lastPeriodStart, today = new Date()) {
  if (!lastPeriodStart) return null;

  const start = new Date(lastPeriodStart);
  start.setHours(0, 0, 0, 0);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);

  return Math.floor((now - start) / 86400000) + 1;
}

module.exports = { predictNextCycle, cyclePhase, currentCycleDay };
