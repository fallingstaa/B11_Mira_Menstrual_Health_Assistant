const mongoose = require("mongoose");

const MenstrualRecord = require("../models/MenstrualRecord");
const User = require("../models/User");
const { success, successMessage, error } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");
const { toDayKey, isValidDateString, isSameMonth, isPastMonth } = require("../utils/dateHelper");
const { predictNextCycle, buildPhases, cyclePhase, currentCycleDay } = require("../services/predictionService");
const { recomputeCycleCache, checkPeriodDayAgainstHistory } = require("../services/cycleCacheService");
const { resolveAsOf } = require("../utils/devClock");

/**
 * Server-side backstop for the same "current month always editable, a past month gets
 * one first-time backfill and then locks" rule the mobile Calendar UI already enforces
 * client-side (see calendar.tsx's openDayEditor/selectDay, and PeriodEntriesSummary's
 * lockPastMonths) — nothing here should trust the app alone to have refused an edit it
 * shouldn't have allowed, since a client-side check is only ever a UX nicety, not
 * actual enforcement.
 *
 *  - A future date is never loggable at all — there's nothing to record yet.
 *  - The current calendar month is always writable, any number of times.
 *  - A past month can still be backfilled the very first time, but once *any* record
 *    exists for that date, it's locked — no further edits or deletes — since that data
 *    already feeds the cached cycle-length/prediction math (see cycleCacheService.js)
 *    and shouldn't change out from under it after the fact.
 *
 * `today` is resolveAsOf(req) at the call site, not a raw `new Date()` — so, same as
 * every other consumer of that dev-only escape hatch, this locking logic itself can be
 * exercised with a simulated date in dev, but a real user can never spoof their own
 * "today" to bypass it once deployed.
 *
 * Returns null if the write is allowed, or { statusCode, message } to reject it with.
 */
async function checkRecordEditable(userId, date, today) {
  const dayKey = toDayKey(date);
  if (dayKey > toDayKey(today)) {
    return { statusCode: 400, message: "Can't log a period day that hasn't happened yet." };
  }
  if (isSameMonth(dayKey, today) || !isPastMonth(dayKey, today)) return null;

  const existing = await MenstrualRecord.findOne({ userId, date: dayKey });
  if (existing) {
    return {
      statusCode: 409,
      message: "This day is from a previous month and was already logged, so it can't be changed anymore.",
    };
  }
  return null;
}

const getPrediction = asyncHandler(async (req, res) => {
  const { cycle } = req.user;
  const prediction = predictNextCycle(cycle);
  // ?asOf=YYYY-MM-DD (dev only, see devClock.js) simulates a different "today" — lets
  // currentDay/phase be checked without waiting for the real date to catch up. The
  // predicted dates themselves (nextPeriodStart etc.) don't depend on "today" at all,
  // only on lastPeriodStart + the cached averages, so asOf never affects those.
  const currentDay = currentCycleDay(cycle.lastPeriodStart, resolveAsOf(req));

  return success(res, {
    currentDay,
    averageCycleLength: cycle.averageCycleLength,
    averagePeriodLength: cycle.averagePeriodLength,
    ...prediction,
    phase: currentDay ? cyclePhase(currentDay, cycle.averageCycleLength, cycle.averagePeriodLength) : null,
    // The full 4-phase day-range breakdown (Prediction screen's "Cycle Phases" card),
    // not just which one `currentDay` is in — always present, even before any period's
    // ever been logged, since it's derived purely from averageCycleLength/
    // averagePeriodLength (which default to 28/5), unlike the rest of this response.
    phases: buildPhases(cycle.averageCycleLength, cycle.averagePeriodLength),
  });
});

const listRecords = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  if (from && !isValidDateString(from)) return error(res, "from must be a valid date (YYYY-MM-DD)", 400);
  if (to && !isValidDateString(to)) return error(res, "to must be a valid date (YYYY-MM-DD)", 400);

  const filter = { userId: req.user._id };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = toDayKey(from);
    if (to) filter.date.$lte = toDayKey(to);
  }

  const records = await MenstrualRecord.find(filter).sort({ date: 1 });
  return success(res, records);
});

// Body shape (date/source/flowLevel/etc.) is already validated by the `validate`
// middleware in menstrualRoutes.js (see validators/menstrualValidators.js) before this
// controller ever runs — req.body here can be trusted as-is.
const upsertRecord = asyncHandler(async (req, res) => {
  const { date, isPeriodDay, isPeriodEnd, flowLevel, symptoms, mood, notes, source } = req.body;

  const dayKey = toDayKey(date);

  const lockError = await checkRecordEditable(req.user._id, dayKey, resolveAsOf(req));
  if (lockError) return error(res, lockError.message, lockError.statusCode);

  // PERIOD-004: reject a period day that contradicts this user's already-saved history (an end
  // date before an already-open period's start, or a new period day the day right after an
  // already-closed one) — see checkPeriodDayAgainstHistory's own comment for why this can't be
  // a request-shape (Zod) check alone. Checked, and rejected, before any write below.
  const consistencyError = await checkPeriodDayAgainstHistory(req.user._id, [
    { date: dayKey, isPeriodDay: !!isPeriodDay, isPeriodEnd: !!isPeriodEnd },
  ]);
  if (consistencyError) return error(res, consistencyError, 400);

  // If this day is being flagged as the period's end, un-flag any other day for this
  // user first — mirrors setPeriodEndDay() in the app's client-side state today.
  if (isPeriodEnd) {
    await MenstrualRecord.updateMany(
      { userId: req.user._id, isPeriodEnd: true },
      { $set: { isPeriodEnd: false } }
    );
  }

  const record = await MenstrualRecord.findOneAndUpdate(
    { userId: req.user._id, date: dayKey },
    {
      $set: {
        isPeriodDay: !!isPeriodDay,
        isPeriodEnd: !!isPeriodEnd,
        flowLevel,
        symptoms: symptoms ?? [],
        mood,
        notes,
        source,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Flips the onboarding flag the first time any day gets marked — same rule Home
  // uses client-side (firstPeriodRecorded derived from periodEntries, never a
  // separately-settable flag that a screen could forget to flip).
  if (isPeriodDay && !req.user.onboarding.firstPeriodRecorded) {
    req.user.onboarding.firstPeriodRecorded = true;
    await req.user.save();
  }

  // Re-derive User.cycle (lastPeriodStart/End, running averages, next-period
  // prediction) from actual record history — without this, GET /prediction and the
  // `cycle` block on GET /profile/me never move past their defaults no matter how much
  // gets logged here. Runs on every write rather than lazily on read so both of those
  // GETs stay a single cheap document fetch.
  await recomputeCycleCache(req.user._id);

  return success(res, record, 201);
});

const deleteRecord = asyncHandler(async (req, res) => {
  if (!isValidDateString(req.params.date)) return error(res, "date must be a valid date (YYYY-MM-DD)", 400);

  const dayKey = toDayKey(req.params.date);

  // A delete only ever concerns an *existing* record, which — by checkRecordEditable's
  // own rule — is exactly the case a past month always locks (the "one first-time
  // backfill" allowance never applies here, since there's nothing left to backfill
  // once something's already there to delete).
  const lockError = await checkRecordEditable(req.user._id, dayKey, resolveAsOf(req));
  if (lockError) return error(res, lockError.message, lockError.statusCode);

  await MenstrualRecord.findOneAndDelete({ userId: req.user._id, date: dayKey });
  await recomputeCycleCache(req.user._id);
  return successMessage(res, `Record for ${req.params.date} deleted.`);
});

// Body shape is already validated by the `validate` middleware in menstrualRoutes.js
// (see validators/menstrualValidators.js) before this controller ever runs.
//
// Server-side landing spot for the three onboarding-flow answers that AREN'T a dated
// MenstrualRecord: "I don't remember any dates" (isBeginner) and "do you know your
// usual cycle/period length?" (manualCycleLength/manualPeriodLength) — see
// period-setup.tsx's three paths and context/app-state.tsx's setIsBeginner/
// setAverageCycleLength/setAveragePeriodDuration. Deliberately separate from
// PUT /api/profile/me: those are generic account-settings fields, these are
// cycle-prediction inputs that immediately feed back into `cycle.average*` below.
const updateCycleSetup = asyncHandler(async (req, res) => {
  const { isBeginner, manualCycleLength, manualPeriodLength } = req.body;

  if (isBeginner !== undefined) req.user.onboarding.isBeginner = isBeginner;
  if (manualCycleLength !== undefined) req.user.cycle.manualCycleLength = manualCycleLength;
  if (manualPeriodLength !== undefined) req.user.cycle.manualPeriodLength = manualPeriodLength;
  await req.user.save();

  // A manual estimate only ever takes effect while there's no/insufficient real
  // history to compute from — re-derive right away so GET /profile/me and
  // GET /menstrual/prediction reflect it immediately instead of waiting for the next
  // record write (which, for Path C/isBeginner in particular, may never come).
  await recomputeCycleCache(req.user._id);

  const refreshed = await User.findById(req.user._id).select("onboarding.isBeginner cycle");
  return success(res, {
    isBeginner: refreshed.onboarding.isBeginner,
    manualCycleLength: refreshed.cycle.manualCycleLength,
    manualPeriodLength: refreshed.cycle.manualPeriodLength,
    cycle: refreshed.cycle,
  });
});

// Body shape validated by validate(batchUpsertRecordSchema) in menstrualRoutes.js.
//
// Writes every record in one Mongo transaction — either all of them land or none do,
// so a bad entry partway through a large batch can't leave the earlier ones committed
// with the rest missing. Requires a replica-set MongoDB deployment (Atlas, used here,
// always qualifies; a bare local `mongod` does not). recomputeCycleCache runs exactly
// once at the end, outside the transaction — it does its own separate read/write
// against User.cycle (a different concern from the batch write's own atomicity), and
// re-reads *all* of a user's records from scratch each call, so running it once after
// the batch commits is both correct and far cheaper than once per record.
const batchUpsertRecords = asyncHandler(async (req, res) => {
  const { source, records } = req.body;
  const today = resolveAsOf(req);

  // Same lock rule as the single-record upsert, checked for every entry up front —
  // "all or nothing" applies to this rule too, not just the transaction below: one
  // locked date anywhere in the batch rejects the whole request rather than silently
  // saving everything else around it.
  for (const r of records) {
    const lockError = await checkRecordEditable(req.user._id, r.date, today);
    if (lockError) return error(res, `${r.date}: ${lockError.message}`, lockError.statusCode);
  }

  // PERIOD-004: same history-consistency check as the single-record upsert above — Calendar's
  // day-by-day editor goes through this batch endpoint too (as a one-entry batch), so this is
  // the only codepath that actually catches it. Checked, and rejected, before the transaction
  // below writes anything.
  const consistencyError = await checkPeriodDayAgainstHistory(
    req.user._id,
    records.map((r) => ({ date: toDayKey(r.date), isPeriodDay: r.isPeriodDay, isPeriodEnd: r.isPeriodEnd })),
  );
  if (consistencyError) return error(res, consistencyError, 400);

  const session = await mongoose.startSession();
  let saved;
  try {
    await session.withTransaction(async () => {
      // Same "at most one isPeriodEnd" rule as the single-record upsert (see
      // upsertRecord above), applied once for the whole batch up front — doing it
      // per-record in the loop below would just have each write undo the flag the
      // previous one in the same batch just set.
      if (records.some((r) => r.isPeriodEnd)) {
        await MenstrualRecord.updateMany(
          { userId: req.user._id, isPeriodEnd: true },
          { $set: { isPeriodEnd: false } },
          { session }
        );
      }

      // Sequential, not Promise.all — concurrent writes inside one transaction can
      // collide with a WriteConflict even when they target different documents, and
      // there's no meaningful latency cost at the 90-record cap the schema enforces.
      saved = [];
      for (const r of records) {
        const record = await MenstrualRecord.findOneAndUpdate(
          { userId: req.user._id, date: toDayKey(r.date) },
          {
            $set: {
              isPeriodDay: r.isPeriodDay,
              isPeriodEnd: r.isPeriodEnd,
              flowLevel: r.flow,
              symptoms: r.symptoms,
              mood: r.mood,
              notes: r.notes,
              source,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, session }
        );
        saved.push(record);
      }

      if (records.some((r) => r.isPeriodDay) && !req.user.onboarding.firstPeriodRecorded) {
        req.user.onboarding.firstPeriodRecorded = true;
        await req.user.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }

  await recomputeCycleCache(req.user._id);

  return success(res, saved, 201);
});

module.exports = { getPrediction, listRecords, upsertRecord, deleteRecord, updateCycleSetup, batchUpsertRecords };
