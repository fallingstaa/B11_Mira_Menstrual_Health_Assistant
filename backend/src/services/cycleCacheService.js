const MenstrualRecord = require("../models/MenstrualRecord");
const User = require("../models/User");
const { daysBetween } = require("../utils/dateHelper");
const { predictNextCycle } = require("./predictionService");

// Matches the defaults on User.cycle in models/User.js — used whenever there isn't
// enough history yet to average from (fewer than two logged periods).
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

/**
 * Groups a user's `isPeriodDay` records (sorted ascending) into contiguous date-range
 * "episodes" — one per logged period, regardless of how many separate check-ins/edits
 * built it up. Two records belong to the same episode iff they're exactly one calendar
 * day apart.
 */
function groupIntoEpisodes(records) {
  const episodes = [];
  for (const record of records) {
    const last = episodes[episodes.length - 1];
    if (last && daysBetween(last.end, record.date) === 1) {
      last.end = record.date;
      last.hasExplicitEnd = last.hasExplicitEnd || record.isPeriodEnd;
    } else {
      episodes.push({ start: record.date, end: record.date, hasExplicitEnd: record.isPeriodEnd });
    }
  }
  return episodes;
}

/**
 * Recomputes `User.cycle` (the denormalized prediction cache — see the comment on the
 * schema in models/User.js) from the user's actual MenstrualRecord history. Call this
 * after any write that could change that history (upsert/delete a record) — reads
 * (`GET /profile/me`, `GET /menstrual/prediction`) stay cheap because they just read
 * whatever this last computed, instead of re-deriving it on every request.
 *
 * Averages use *all* past episodes, not just the most recent couple — fine for now
 * given how little history a new-ish user has; swap for a recency-weighted average
 * once there's enough real data to justify it (same note predictionService.js already
 * has for the next-cycle math itself).
 */
async function recomputeCycleCache(userId) {
  const [records, user] = await Promise.all([
    MenstrualRecord.find({ userId, isPeriodDay: true }).sort({ date: 1 }),
    // Only the manual onboarding seeds are needed here — see cycle-setup below and the
    // schema comment on User.cycle.manualCycleLength/manualPeriodLength.
    User.findById(userId).select("cycle.manualCycleLength cycle.manualPeriodLength"),
  ]);

  // Falls back to the manual onboarding answer (cycle-length-question.tsx, saved via
  // PUT /api/menstrual/cycle-setup) whenever there isn't yet enough real history to
  // compute a real average — only once that's exhausted too do we fall back to the
  // hardcoded product default. Never the other way around: a manual answer never
  // overrides real logged history (see the cycleLengths/completedLengths checks below).
  const fallbackCycleLength = user?.cycle?.manualCycleLength ?? DEFAULT_CYCLE_LENGTH;
  const fallbackPeriodLength = user?.cycle?.manualPeriodLength ?? DEFAULT_PERIOD_LENGTH;

  if (records.length === 0) {
    // Every period day for this user was deleted/un-marked — fall back to the same
    // "nothing logged yet" state a brand-new account starts in (modulo any manual
    // estimate already on file), rather than leaving a stale cache behind.
    await User.findByIdAndUpdate(userId, {
      $set: {
        "cycle.averageCycleLength": fallbackCycleLength,
        "cycle.averagePeriodLength": fallbackPeriodLength,
        "cycle.lastPeriodStart": null,
        "cycle.lastPeriodEnd": null,
        "cycle.nextPeriodStart": null,
        "cycle.nextPeriodEnd": null,
        "cycle.fertileWindowStart": null,
        "cycle.fertileWindowEnd": null,
      },
    });
    return;
  }

  const episodes = groupIntoEpisodes(records);
  const lastEpisode = episodes[episodes.length - 1];

  // Period length: average span of episodes we're confident are *complete* — ones
  // explicitly flagged with an end day, or any earlier episode (superseded by a later
  // one starting, so it can't still be ongoing). The most recent episode only counts
  // if it was explicitly ended; otherwise it may still be in progress and would skew
  // the average short.
  const completedLengths = episodes
    .filter((ep) => ep !== lastEpisode || ep.hasExplicitEnd)
    .map((ep) => daysBetween(ep.start, ep.end) + 1);
  const averagePeriodLength = completedLengths.length
    ? Math.round(completedLengths.reduce((sum, n) => sum + n, 0) / completedLengths.length)
    : fallbackPeriodLength;

  // Cycle length: average gap between consecutive episode start dates.
  const cycleLengths = [];
  for (let i = 1; i < episodes.length; i++) {
    cycleLengths.push(daysBetween(episodes[i - 1].start, episodes[i].start));
  }
  const averageCycleLength = cycleLengths.length
    ? Math.round(cycleLengths.reduce((sum, n) => sum + n, 0) / cycleLengths.length)
    : fallbackCycleLength;

  const lastPeriodStart = lastEpisode.start;
  const lastPeriodEnd = lastEpisode.end;

  const prediction = predictNextCycle({ lastPeriodStart, averageCycleLength, averagePeriodLength });

  await User.findByIdAndUpdate(userId, {
    $set: {
      "cycle.averageCycleLength": averageCycleLength,
      "cycle.averagePeriodLength": averagePeriodLength,
      "cycle.lastPeriodStart": lastPeriodStart,
      "cycle.lastPeriodEnd": lastPeriodEnd,
      "cycle.nextPeriodStart": prediction?.nextPeriodStart ?? null,
      "cycle.nextPeriodEnd": prediction?.nextPeriodEnd ?? null,
      "cycle.fertileWindowStart": prediction?.fertileWindowStart ?? null,
      "cycle.fertileWindowEnd": prediction?.fertileWindowEnd ?? null,
    },
  });
}

module.exports = { recomputeCycleCache };
