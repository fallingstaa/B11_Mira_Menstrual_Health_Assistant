const mongoose = require("mongoose");

const MenstrualRecord = require("../models/MenstrualRecord");
const User = require("../models/User");
const { success, successMessage, error } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");
const { toDayKey, isValidDateString } = require("../utils/dateHelper");
const { predictNextCycle, cyclePhase, currentCycleDay } = require("../services/predictionService");
const { recomputeCycleCache } = require("../services/cycleCacheService");
const { resolveAsOf } = require("../utils/devClock");

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

// Body shape (date/source/status/etc.) is already validated by the `validate`
// middleware in menstrualRoutes.js (see validators/menstrualValidators.js) before this
// controller ever runs — req.body here can be trusted as-is.
const upsertRecord = asyncHandler(async (req, res) => {
  const { date, isPeriodDay, isPeriodEnd, status, flowLevel, symptoms, mood, notes, source } = req.body;

  const dayKey = toDayKey(date);

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
        status,
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
              status: r.status,
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
