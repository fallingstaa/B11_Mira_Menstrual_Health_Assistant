const mongoose = require("mongoose");

const { MENSTRUAL_RECORD_SOURCES, MENSTRUAL_STATUS } = require("../utils/constants");

/**
 * One document per user per logged calendar day — matches the app's own
 * Record<dateKey, entry> shape in app-state.tsx, rather than one row per period
 * episode. flowLevel/mood are left as free strings (not enums) since those option
 * sets aren't finalized yet; tighten them once the UI's option lists are locked.
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
    symptoms: { type: [String], default: [] },
    mood: { type: String, default: null },
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
