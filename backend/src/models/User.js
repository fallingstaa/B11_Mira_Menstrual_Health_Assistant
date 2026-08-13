const mongoose = require("mongoose");

/**
 * One document per account. UserProfile.js was folded in here rather than kept as its
 * own collection — it's 1:1 with User, small, and every screen that needs one needs
 * both (see schema design decision: embed 1:1/bounded data, reference 1:many/unbounded
 * data). Cycle fields are a denormalized *cache* of predictions derived from
 * MenstrualRecord history, recomputed by predictionService — not the source of truth.
 */
const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    profile: {
      name: { type: String, required: true, trim: true },
      // Not collected at registration — set the first time the user goes through the
      // period-setup flow (period-setup.tsx), so this is legitimately null until then.
      dateOfBirth: { type: Date, default: null },
      preferredLanguage: { type: String, default: "English" },
      firstPeriodDate: { type: Date, default: null },
    },

    cycle: {
      averageCycleLength: { type: Number, default: 28 },
      averagePeriodLength: { type: Number, default: 5 },
      lastPeriodStart: { type: Date, default: null },
      lastPeriodEnd: { type: Date, default: null },
      nextPeriodStart: { type: Date, default: null },
      nextPeriodEnd: { type: Date, default: null },
      fertileWindowStart: { type: Date, default: null },
      fertileWindowEnd: { type: Date, default: null },
    },

    preferences: {
      pushNotifications: { type: Boolean, default: true },
      checkinReminders: { type: Boolean, default: true },
    },

    onboarding: {
      firstPeriodRecorded: { type: Boolean, default: false },
      firstQuestionAsked: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
