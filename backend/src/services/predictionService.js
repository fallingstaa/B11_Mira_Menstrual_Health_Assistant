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

  // Next Period Start: start date + cycle length, full stop — deliberately never touches
  // averagePeriodLength/lastPeriodEnd at all. Cycle length is a start-to-start measurement;
  // how long a period bleeds for doesn't move when the *next* one begins.
  const nextPeriodStart = addDays(lastPeriodStart, averageCycleLength);
  // Next Period End: only place averagePeriodLength enters this function at all — how long
  // the *next* period is expected to last, not this one's.
  const nextPeriodEnd = addDays(nextPeriodStart, averagePeriodLength - 1);
  // Ovulation is exactly 14 days before the *next* period (the luteal phase is the
  // relatively fixed part of a cycle) — anchored to nextPeriodStart, so this correctly
  // shifts later for a longer cycle and earlier for a shorter one. The previous formula
  // here (`-(averageCycleLength - 11)`) algebraically canceled averageCycleLength back out
  // to a constant `lastPeriodStart + 11` — every cycle length landed on the exact same
  // fertile window regardless of how long the cycle actually was, which was wrong.
  const ovulationDay = addDays(nextPeriodStart, -14);
  // Fertile window: the 5 days leading up to and including ovulation day.
  const fertileWindowStart = addDays(ovulationDay, -4);
  const fertileWindowEnd = ovulationDay;

  return { nextPeriodStart, nextPeriodEnd, fertileWindowStart, fertileWindowEnd };
}

/**
 * The 4 cycle phases as day-number ranges (Day 1 = the period's start), scaled to
 * *this* user's own averageCycleLength/averagePeriodLength instead of assuming a fixed
 * 28-day cycle for everyone.
 *
 * - Menstrual: Day 1 through averagePeriodLength.
 * - Ovulation: a 3-day window centered on the estimated ovulation day
 *   (averageCycleLength - 14 — the same "~14 days before the next period" assumption
 *   predictNextCycle() above uses for fertileWindowStart/End).
 * - Follicular: everything between the end of Menstrual and the start of Ovulation.
 * - Luteal: everything after Ovulation ends, through the end of the cycle.
 *
 * cycleLength is floored at 20 so a corrupt/unrealistic averageCycleLength can't push
 * the ovulation window earlier than Menstrual ends. Every boundary is clamped to stay
 * >= the one before it, so an unusual combination (e.g. a very short cycle with a long
 * period) collapses a phase to zero days instead of an inverted range — those get
 * filtered out below rather than returned as nonsense.
 *
 * This used to be duplicated three ways (here, mobile-app's home.tsx cyclePhase(), and
 * prediction.tsx's buildPhases()) with a comment on all three asking whoever changes
 * one to update the other two by hand. Now this is the only copy of the actual
 * day-range math — GET /api/menstrual/prediction's `phases` field is meant to replace
 * the client-side copies once something actually calls it; until then those two client
 * copies still exist and still need to be kept in sync by hand.
 */
function buildPhases(averageCycleLength = 28, averagePeriodLength = 5) {
  const periodLength = Math.max(1, averagePeriodLength);
  const cycleLength = Math.max(20, averageCycleLength);
  const estimatedOvulationDay = cycleLength - 14;

  const menstrualEnd = periodLength;
  const follicularStart = menstrualEnd + 1;
  const ovulationStart = Math.max(follicularStart, estimatedOvulationDay - 1);
  const follicularEnd = ovulationStart - 1;
  const ovulationEnd = Math.max(ovulationStart, estimatedOvulationDay + 1);
  const lutealStart = ovulationEnd + 1;
  const lutealEnd = Math.max(lutealStart, cycleLength);

  const phases = [
    { key: "menstrual", label: "Menstrual phase", start: 1, end: menstrualEnd },
    { key: "follicular", label: "Follicular phase", start: follicularStart, end: follicularEnd },
    { key: "ovulation", label: "Ovulation phase", start: ovulationStart, end: ovulationEnd },
    { key: "luteal", label: "Luteal phase", start: lutealStart, end: lutealEnd },
  ];

  return phases.filter((p) => p.end >= p.start);
}

/**
 * Which of the 4 phases `currentCycleDay` falls into — just buildPhases() above,
 * picked down to the one range currentCycleDay actually lands in (or the last phase,
 * if it somehow falls past the end of every range — same fallback prediction.tsx's
 * currentPhase() uses client-side).
 */
function cyclePhase(currentCycleDay, averageCycleLength = 28, averagePeriodLength = 5) {
  const phases = buildPhases(averageCycleLength, averagePeriodLength);
  const phase = phases.find((p) => currentCycleDay <= p.end) ?? phases[phases.length - 1];
  return phase.label;
}

function currentCycleDay(lastPeriodStart, today = new Date()) {
  if (!lastPeriodStart) return null;

  const start = new Date(lastPeriodStart);
  start.setHours(0, 0, 0, 0);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);

  return Math.floor((now - start) / 86400000) + 1;
}

module.exports = { predictNextCycle, buildPhases, cyclePhase, currentCycleDay };
