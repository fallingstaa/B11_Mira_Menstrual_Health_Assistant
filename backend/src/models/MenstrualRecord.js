const mongoose = require("mongoose");

const { MENSTRUAL_RECORD_SOURCES, MENSTRUAL_STATUS, SYMPTOM_OPTIONS, MOOD_OPTIONS } = require("../utils/constants");

/**
 * One document per user per logged calendar day — matches the app's own
 * Record<dateKey, entry> shape in app-state.tsx, rather than one row per period
 * episode. symptoms/mood are enum-constrained to SYMPTOM_OPTIONS/MOOD_OPTIONS (see
 * utils/constants.js) now that the UI's option lists are finalized/locked — previously
 * these were free strings while that list was still in flux. flowLevel stays a free
 * string; its option set (spotting/light/medium/heavy) hasn't been through the same
 * "final version" lock as symptoms/mood.
 *
 * mood is an array, not a single value — a day can be tagged with more than one mood
 * at once (e.g. "Calm" and "Anxious" together), same multi-select shape as symptoms.
 */
const menstrualRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },

    isPeriodDay: { type: Boolean, default: false },
    // At most one record per user should have this set — enforced in the controller,
    // not the schema (mirrors the "isEnd" comment in the frontend's PeriodDayEntry).
    isPeriodEnd: { type: Boolean, default: false },

    status: { type: String, enum: MENSTRUAL_STATUS, default: null },
    flowLevel: { type: String, default: null },
    symptoms: { type: [{ type: String, enum: SYMPTOM_OPTIONS }], default: [] },
    mood: { type: [{ type: String, enum: MOOD_OPTIONS }], default: [] },
    notes: { type: String, default: "", maxlength: 1000 },

    source: {
      type: String,
      enum: MENSTRUAL_RECORD_SOURCES,
      required: true,
    },
  },
  { timestamps: true }
);

// A user can have at most one record per day.
menstrualRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("MenstrualRecord", menstrualRecordSchema);
