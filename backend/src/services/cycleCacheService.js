const MenstrualRecord = require("../models/MenstrualRecord");
const User = require("../models/User");
const { daysBetween } = require("../utils/dateHelper");
const { predictNextCycle } = require("./predictionService");
const { MAX_MANUAL_PERIOD_LENGTH } = require("../utils/constants");

// Matches the defaults on User.cycle in models/User.js — used whenever there isn't
// enough history yet to average from (fewer than two logged periods).
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

/**
 * Groups a user's `isPeriodDay` records (sorted ascending) into "episodes" — one per
 * logged period, regardless of how many separate check-ins/edits built it up, or what
 * order those edits happened in.
 *
 * An **explicit end day (`isPeriodEnd: true`) is the authoritative boundary** between
 * one episode and the next — once hit, the very next record always starts a new
 * episode, no matter how close in time. Until an episode gets an explicit end, any
 * later record within MAX_MANUAL_PERIOD_LENGTH days of that episode's *start* still
 * joins it (measured from the episode's start, not its last-seen day, so a few small
 * gaps in a row can't chain together into something implausibly long).
 *
 * This used to require records to be exactly one calendar day apart to count as the
 * same episode — which meant recording an end day before going back to fill in a day
 * you'd skipped (e.g. logging the 12th, 13th, 14th, then jumping straight to the 16th
 * as End day before ever entering the 15th) got misread as the 16th starting a brand
 * new, separate period, badly corrupting averageCycleLength/nextPeriodStart until the
 * gap was filled in. Anchoring "same episode" to the *end day marker* instead of *day
 * adjacency* is both what the day-by-day UI already asks users to do (mark Period day
 * vs. End day) and immune to the order/completeness those individual days get logged in.
 */
function groupIntoEpisodes(records) {
  const episodes = [];
  let current = null;

  for (const record of records) {
    const joinsCurrent = current && !current.hasExplicitEnd && daysBetween(current.start, record.date) <= MAX_MANUAL_PERIOD_LENGTH;

    if (joinsCurrent) {
      current.end = record.date;
    } else {
      current = { start: record.date, end: record.date, hasExplicitEnd: false };
      episodes.push(current);
    }

    if (record.isPeriodEnd) current.hasExplicitEnd = true;
  }

  return episodes;
}

/**
 * PERIOD-004 — two ways an *incoming* period-day write can contradict a user's *pre-existing*
 * history, checked only against episodes built from history that doesn't include whatever this
 * write is about to change (see checkPeriodDayAgainstHistory below).
 *
 *  Case 1 (cross-request form) — an incoming end day can't be before the start of a period
 *  that's *already open* in saved history: e.g. a period already saved as running from Sep 5
 *  onward can't suddenly be "ended" on Sep 3, a day before it even started. Same "a single period
 *  can't end before it starts" rule as menstrualValidators.js's batchUpsertRecordSchema, just
 *  checked cross-request instead of within one submission — Calendar's day-by-day editor writes
 *  one day at a time, in *separate* requests, so by the time a user taps an earlier day and marks
 *  it End, the later, already-open period is sitting in MongoDB from a previous request,
 *  invisible to a same-request-only check. This has to run in the controller (with DB access),
 *  not the Zod schema.
 *
 *  A period day landing the very next calendar day after an already-closed End — e.g. Sep 2
 *  marked End, then Sep 3 logged as a plain period day right after it — is rejected too:
 *  groupIntoEpisodes' own rule ("the very next record always starts a new episode, no matter how
 *  close in time") would otherwise silently treat that as a second period starting the very next
 *  day, which reads to a user as "my period didn't actually end on the 2nd." This is deliberately
 *  narrow — only a zero-gap, next-day continuation — so Case 2 (a genuinely new period record,
 *  however many times a month, as long as there's at least one real rest day) is never blocked.
 *
 * Pure — `existingRecords` is this user's saved history *excluding* any date `incoming` is about
 * to overwrite (so editing an already-saved day is never compared against its own old value), and
 * `incoming` is the period-day writes this request is about to make. Both are unit-testable
 * without a database; see checkPeriodDayAgainstHistory below for the DB-fetching wrapper
 * controllers actually call.
 *
 * Returns an error message for the first contradiction found, or null if nothing incoming
 * contradicts the existing history.
 */
function validatePeriodDayConsistency(existingRecords, incoming) {
  const existingEpisodes = groupIntoEpisodes(existingRecords);
  const openEpisode = existingEpisodes.find((ep) => !ep.hasExplicitEnd);

  for (const r of incoming) {
    if (!r.isPeriodDay) continue;

    if (r.isPeriodEnd && openEpisode && r.date < openEpisode.start) {
      return "A period's end date can't be before the start of your current, still-open period.";
    }

    const closedRightBefore = existingEpisodes.some((ep) => ep.hasExplicitEnd && daysBetween(ep.end, r.date) === 1);
    if (closedRightBefore) {
      return "Can't log a period day the day right after one that's already marked as an end — pick a later date, or remove that end mark first.";
    }
  }

  return null;
}

/**
 * DB-aware wrapper around validatePeriodDayConsistency — fetches this user's saved period-day
 * history, excludes whatever date(s) `incomingRecords` is about to write (an edit shouldn't be
 * compared against its own pre-edit value), and validates the incoming writes against what's left.
 *
 * Skips the DB round-trip entirely when nothing in this request touches a period/spotting day at
 * all — e.g. a Check-in write, which explicitly passes isPeriodDay: false.
 */
async function checkPeriodDayAgainstHistory(userId, incomingRecords) {
  const incomingPeriodDays = incomingRecords.filter((r) => r.isPeriodDay);
  if (incomingPeriodDays.length === 0) return null;

  const incomingDates = new Set(incomingPeriodDays.map((r) => r.date.getTime()));
  const saved = await MenstrualRecord.find({ userId, isPeriodDay: true }).select("date isPeriodEnd");
  const existingRecords = saved
    .filter((r) => !incomingDates.has(r.date.getTime()))
    .map((r) => ({ date: r.date, isPeriodEnd: r.isPeriodEnd }))
    .sort((a, b) => a.date - b.date);

  return validatePeriodDayConsistency(existingRecords, incomingPeriodDays);
}

/**
 * Pure computation half of recomputeCycleCache below — given a user's sorted `isPeriodDay`
 * records plus their manual onboarding seeds, returns the full `User.cycle` update object.
 * Split out from the Mongo I/O specifically so this — the actual "given this record history,
 * what should today's cache be" logic — is unit-testable without a database at all. See
 * `cycleCacheService.test.js` for the regular/irregular/early/late/gap-in-logging cases this
 * covers.
 *
 * Averages use *all* past episodes, not just the most recent couple — fine for now given how
 * little history a new-ish user has; swap for a recency-weighted average once there's enough
 * real data to justify it (same note predictionService.js already has for the next-cycle math
 * itself). Worth flagging for anyone tracking a *sustained* cycle-length shift (e.g. a health
 * change): every historical cycle still weighs equally forever, so the average adapts slowly.
 */
function computeCycleUpdate(records, manualCycleLength, manualPeriodLength) {
  // Falls back to the manual onboarding answer (cycle-length-question.tsx /
  // period-length-question.tsx, saved via PUT /api/menstrual/cycle-setup) whenever there
  // isn't yet enough real history to compute a real average — only once that's exhausted too
  // do we fall back to the hardcoded product default. Never the other way around: a manual
  // answer never overrides real logged history (see the cycleLengths/completedLengths checks
  // below) — this is the "only use the 28/5 default if there's genuinely no input at all" rule.
  const fallbackCycleLength = manualCycleLength ?? DEFAULT_CYCLE_LENGTH;
  const fallbackPeriodLength = manualPeriodLength ?? DEFAULT_PERIOD_LENGTH;

  if (records.length === 0) {
    // Every period day for this user was deleted/un-marked — fall back to the same
    // "nothing logged yet" state a brand-new account starts in (modulo any manual
    // estimate already on file), rather than leaving a stale cache behind.
    return {
      averageCycleLength: fallbackCycleLength,
      averagePeriodLength: fallbackPeriodLength,
      lastPeriodStart: null,
      lastPeriodEnd: null,
      nextPeriodStart: null,
      nextPeriodEnd: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
    };
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

  // Cycle length: average gap between consecutive episode start dates. A brand-new episode
  // (e.g. an early/unexpected period) immediately contributes its own real start-to-start gap
  // here the moment it's logged — there's no special-casing needed for "early period": it's
  // just one more (shorter) entry in this same average.
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

  return {
    averageCycleLength,
    averagePeriodLength,
    lastPeriodStart,
    lastPeriodEnd,
    nextPeriodStart: prediction?.nextPeriodStart ?? null,
    nextPeriodEnd: prediction?.nextPeriodEnd ?? null,
    fertileWindowStart: prediction?.fertileWindowStart ?? null,
    fertileWindowEnd: prediction?.fertileWindowEnd ?? null,
  };
}

/**
 * Recomputes `User.cycle` (the denormalized prediction cache — see the comment on the
 * schema in models/User.js) from the user's actual MenstrualRecord history. Call this
 * after any write that could change that history (upsert/delete a record) — reads
 * (`GET /profile/me`, `GET /menstrual/prediction`) stay cheap because they just read
 * whatever this last computed, instead of re-deriving it on every request.
 */
async function recomputeCycleCache(userId) {
  const [records, user] = await Promise.all([
    MenstrualRecord.find({ userId, isPeriodDay: true }).sort({ date: 1 }),
    // Only the manual onboarding seeds are needed here — see cycle-setup below and the
    // schema comment on User.cycle.manualCycleLength/manualPeriodLength.
    User.findById(userId).select("cycle.manualCycleLength cycle.manualPeriodLength"),
  ]);

  const update = computeCycleUpdate(records, user?.cycle?.manualCycleLength, user?.cycle?.manualPeriodLength);

  await User.findByIdAndUpdate(userId, {
    $set: {
      "cycle.averageCycleLength": update.averageCycleLength,
      "cycle.averagePeriodLength": update.averagePeriodLength,
      "cycle.lastPeriodStart": update.lastPeriodStart,
      "cycle.lastPeriodEnd": update.lastPeriodEnd,
      "cycle.nextPeriodStart": update.nextPeriodStart,
      "cycle.nextPeriodEnd": update.nextPeriodEnd,
      "cycle.fertileWindowStart": update.fertileWindowStart,
      "cycle.fertileWindowEnd": update.fertileWindowEnd,
    },
  });
}

module.exports = {
  recomputeCycleCache,
  computeCycleUpdate,
  groupIntoEpisodes,
  validatePeriodDayConsistency,
  checkPeriodDayAgainstHistory,
};
