const MenstrualRecord = require("../models/MenstrualRecord");
const { success, successMessage, error } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");
const { toDayKey } = require("../utils/dateHelper");
const { MENSTRUAL_RECORD_SOURCES, MENSTRUAL_STATUS } = require("../utils/constants");
const { predictNextCycle, cyclePhase, currentCycleDay } = require("../services/predictionService");

const getPrediction = asyncHandler(async (req, res) => {
  const { cycle } = req.user;
  const prediction = predictNextCycle(cycle);
  const currentDay = currentCycleDay(cycle.lastPeriodStart);

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
  const filter = { userId: req.user._id };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = toDayKey(from);
    if (to) filter.date.$lte = toDayKey(to);
  }

  const records = await MenstrualRecord.find(filter).sort({ date: 1 });
  return success(res, records);
});

const upsertRecord = asyncHandler(async (req, res) => {
  const { date, isPeriodDay, isPeriodEnd, status, flowLevel, symptoms, mood, notes, source } = req.body;

  if (!date) return error(res, "date is required", 400);
  if (!source || !MENSTRUAL_RECORD_SOURCES.includes(source)) {
    return error(res, `source must be one of: ${MENSTRUAL_RECORD_SOURCES.join(", ")}`, 400);
  }
  if (status && !MENSTRUAL_STATUS.includes(status)) {
    return error(res, `status must be one of: ${MENSTRUAL_STATUS.join(", ")}`, 400);
  }

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

  return success(res, record, 201);
});

const deleteRecord = asyncHandler(async (req, res) => {
  const dayKey = toDayKey(req.params.date);
  await MenstrualRecord.findOneAndDelete({ userId: req.user._id, date: dayKey });
  return successMessage(res, `Record for ${req.params.date} deleted.`);
});

module.exports = { getPrediction, listRecords, upsertRecord, deleteRecord };
