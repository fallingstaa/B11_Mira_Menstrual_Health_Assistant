const { z } = require("zod");

const {
  MENSTRUAL_RECORD_SOURCES,
  SYMPTOM_OPTIONS,
  MOOD_OPTIONS,
  MIN_MANUAL_CYCLE_LENGTH,
  MAX_MANUAL_CYCLE_LENGTH,
  MIN_MANUAL_PERIOD_LENGTH,
  MAX_MANUAL_PERIOD_LENGTH,
} = require("../utils/constants");

// symptoms/mood are enum-constrained to the final, locked option lists (see
// SYMPTOM_OPTIONS/MOOD_OPTIONS in utils/constants.js, mirroring mobile-app's
// constants/mock-data.ts) — sending anything outside those lists is now a 400, not
// silently accepted free text. Both are arrays, not a single value each — a day can
// have more than one symptom or mood at once, no limit on how many.
const symptomsSchema = z
  .array(z.enum(SYMPTOM_OPTIONS, { message: `each symptom must be one of: ${SYMPTOM_OPTIONS.join(", ")}` }))
  .optional()
  .default([]);
const moodSchema = z
  .array(z.enum(MOOD_OPTIONS, { message: `each mood must be one of: ${MOOD_OPTIONS.join(", ")}` }))
  .optional()
  .default([]);

const upsertRecordSchema = z.object({
  date: z.iso.date("date must be YYYY-MM-DD"),
  isPeriodDay: z.boolean().optional().default(false),
  isPeriodEnd: z.boolean().optional().default(false),
  flowLevel: z.string().trim().min(1).max(40).optional(),
  symptoms: symptomsSchema,
  mood: moodSchema,
  notes: z.string().max(1000).optional().default(""),
  source: z.enum(MENSTRUAL_RECORD_SOURCES, { message: `source must be one of: ${MENSTRUAL_RECORD_SOURCES.join(", ")}` }),
});

// Backs PUT /api/menstrual/cycle-setup — the server-side landing spot for
// context/app-state.tsx's setIsBeginner/setAverageCycleLength/setAveragePeriodDuration,
// called from period-setup.tsx's three onboarding paths (and the review flow later, if
// a screen ever lets the user revisit their answer). All optional, but at least one
// must be present — matches PUT /api/profile/me's partial-update shape.
const cycleSetupSchema = z
  .object({
    isBeginner: z.boolean().optional(),
    manualCycleLength: z
      .number()
      .int(`manualCycleLength must be a whole number`)
      .min(MIN_MANUAL_CYCLE_LENGTH, `manualCycleLength must be at least ${MIN_MANUAL_CYCLE_LENGTH}`)
      .max(MAX_MANUAL_CYCLE_LENGTH, `manualCycleLength must be at most ${MAX_MANUAL_CYCLE_LENGTH}`)
      .optional(),
    manualPeriodLength: z
      .number()
      .int(`manualPeriodLength must be a whole number`)
      .min(MIN_MANUAL_PERIOD_LENGTH, `manualPeriodLength must be at least ${MIN_MANUAL_PERIOD_LENGTH}`)
      .max(MAX_MANUAL_PERIOD_LENGTH, `manualPeriodLength must be at most ${MAX_MANUAL_PERIOD_LENGTH}`)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one of: isBeginner, manualCycleLength, manualPeriodLength.",
  });

// Backs POST /api/menstrual/records/batch — logging several days in one call (e.g. a
// guided flow that marks a whole period's worth of days at once) instead of one POST
// per day. `source` is top-level, applying to every entry, rather than repeated per
// record — a batch write always comes from a single screen/action. `records` is capped
// at 90 (~3 months) partly to keep this a sane single write and partly because that's
// comfortably under the 1mb JSON body limit (see server.js) even at every field's max
// length.
const batchRecordEntrySchema = z.object({
  date: z.iso.date("date must be YYYY-MM-DD"),
  // Defaults to true here — unlike the single-record upsert's default of false — since
  // a *batch* log is, in practice, always "mark these days as period days".
  isPeriodDay: z.boolean().optional().default(true),
  isPeriodEnd: z.boolean().optional().default(false),
  // Named `flow`, not `flowLevel`, in the batch request body — mapped onto the saved
  // record's `flowLevel` field by the controller, same underlying data either way.
  flow: z.string().trim().min(1).max(40).optional(),
  symptoms: symptomsSchema,
  mood: moodSchema,
  notes: z.string().max(1000).optional().default(""),
});

const batchUpsertRecordSchema = z
  .object({
    source: z.enum(MENSTRUAL_RECORD_SOURCES, { message: `source must be one of: ${MENSTRUAL_RECORD_SOURCES.join(", ")}` }),
    records: z
      .array(batchRecordEntrySchema)
      .min(1, "records must contain at least 1 entry")
      .max(90, "records is capped at 90 entries per batch"),
  })
  // PERIOD-004: server-side backstop for "end date before start date" — record.tsx already
  // rejects this itself, but nothing stops a client that isn't record.tsx (a raw API call, a
  // future screen, curl) from sending an isPeriodEnd day that's earlier than the batch's own
  // isPeriodDay days. `date` is already a validated YYYY-MM-DD string here, which sorts
  // correctly with plain string comparison — no need to parse to Date first.
  //
  // Compares against the LATEST isPeriodDay date, not the earliest: the end-flagged record is
  // itself always isPeriodDay too (record.tsx marks every day in the range, including the last
  // one), so comparing against the earliest would just compare the end date to itself whenever
  // it happens to be the earliest day submitted — the bug this refine exists to catch. A real,
  // non-contradictory end day is the *last* period day in the batch, never earlier than any
  // other period day sent alongside it.
  .refine(
    (data) => {
      const periodDayDates = data.records.filter((r) => r.isPeriodDay).map((r) => r.date);
      const endDates = data.records.filter((r) => r.isPeriodEnd).map((r) => r.date);
      if (periodDayDates.length === 0 || endDates.length === 0) return true;
      const latestPeriodDay = periodDayDates.reduce((max, d) => (d > max ? d : max));
      return endDates.every((end) => end >= latestPeriodDay);
    },
    { message: "A period's end date can't be before its start date." },
  );

module.exports = { upsertRecordSchema, cycleSetupSchema, batchUpsertRecordSchema };
