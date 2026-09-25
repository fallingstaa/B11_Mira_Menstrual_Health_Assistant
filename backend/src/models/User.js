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
      // Collected at registration (register.tsx's "How old are you?" field) — a plain
      // integer, not a birthdate, since that's all the UI ever asks for.
      age: { type: Number, default: null },
      // Not collected at registration — set the first time the user goes through the
      // period-setup flow (period-setup.tsx), so this is legitimately null until then.
      dateOfBirth: { type: Date, default: null },
      preferredLanguage: { type: String, default: "English" },
      firstPeriodDate: { type: Date, default: null },
      // Set by POST /api/profile/avatar (actual photo upload, stored in MongoDB's
      // Avatar collection) and cleared by DELETE /api/profile/avatar — see profileController.js.
      // Also settable directly via PUT /api/profile/me for the rarer case of pointing
      // this at a URL hosted somewhere else entirely (see the .nullable() note on
      // profileValidators.js's updateProfileSchema), though that path only ever
      // changes this field, never anything in Storage.
      avatarUrl: { type: String, default: null },
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
      // The user's own onboarding answer to "do you know your usual cycle/period
      // length?" (cycle-length-question.tsx) — a seed for averageCycleLength/
      // averagePeriodLength above, used only while there isn't yet enough real
      // MenstrualRecord history to compute those for real. See cycleCacheService.js.
      // Never cleared once set, so it stays available if the real history is later
      // deleted back down below the 2-episode threshold.
      manualCycleLength: { type: Number, default: null },
      manualPeriodLength: { type: Number, default: null },
    },

    preferences: {
      pushNotifications: { type: Boolean, default: true },
      checkinReminders: { type: Boolean, default: true },
    },

    // Set via POST /api/profile/push-token. Storage only — there's no FCM/Expo push
    // *delivery* wired up yet (see reminderRoutes.js's "no push delivery yet" note);
    // this is the missing piece delivery would eventually read to know where to send.
    device: {
      expoPushToken: { type: String, default: null },
      pushTokenUpdatedAt: { type: Date, default: null },
    },

    onboarding: {
      firstPeriodRecorded: { type: Boolean, default: false },
      firstQuestionAsked: { type: Boolean, default: false },
      // Set via PUT /api/menstrual/cycle-setup when the user picks "I don't remember
      // any dates" (last-period-unknown.tsx, Path C of the setup flow) — no
      // MenstrualRecord is ever created for that path, so nothing else would ever flip
      // this the way firstPeriodRecorded/firstQuestionAsked flip themselves as a side
      // effect of some other write.
      isBeginner: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
