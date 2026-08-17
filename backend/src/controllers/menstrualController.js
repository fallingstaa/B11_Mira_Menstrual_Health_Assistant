const MenstrualRecord = require("../models/MenstrualRecord");
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
    phase: currentDay ? cyclePhase(currentDay) : null,
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

module.exports = { getPrediction, listRecords, upsertRecord, deleteRecord };
