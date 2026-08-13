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

/** Matches the cyclePhase() thresholds already used in home.tsx/prediction.tsx. */
function cyclePhase(currentDay) {
  if (currentDay <= 5) return "Menstrual phase";
  if (currentDay <= 13) return "Follicular phase";
  if (currentDay <= 16) return "Ovulation phase";
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
