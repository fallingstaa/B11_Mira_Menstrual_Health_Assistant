const { getAuth } = require("firebase-admin/auth");

const firebaseApp = require("../../config/firebase");
const MenstrualRecord = require("../models/MenstrualRecord");
const AIConversation = require("../models/AIConversation");
const NotificationReminder = require("../models/NotificationReminder");
const User = require("../models/User");
const { success, successMessage } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

const getMe = asyncHandler(async (req, res) => {
  const u = req.user;
  return success(res, {
    userId: u._id,
    name: u.profile.name,
    email: u.email,
    age: u.profile.age,
    dateOfBirth: u.profile.dateOfBirth,
    preferredLanguage: u.profile.preferredLanguage,
    preferences: u.preferences,
    // firstPeriodRecorded/firstQuestionAsked/isBeginner — lets a client that's just
    // (re)signed in restore Home's "first-time" vs "returning" layout and the
    // Getting-Started checklist without re-deriving them from scratch, the way
    // app-state.tsx currently does client-side only (see its header comment).
    onboarding: u.onboarding,
    cycle: u.cycle,
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, age, dateOfBirth, preferredLanguage, preferences } = req.body;

  if (name !== undefined) req.user.profile.name = name;
  if (age !== undefined) req.user.profile.age = age;
  if (dateOfBirth !== undefined) req.user.profile.dateOfBirth = dateOfBirth;
  if (preferredLanguage !== undefined) req.user.profile.preferredLanguage = preferredLanguage;
  if (preferences?.pushNotifications !== undefined) {
    req.user.preferences.pushNotifications = preferences.pushNotifications;
  }
  if (preferences?.checkinReminders !== undefined) {
    req.user.preferences.checkinReminders = preferences.checkinReminders;
  }

  await req.user.save();

  return success(res, {
    userId: req.user._id,
    name: req.user.profile.name,
    age: req.user.profile.age,
    dateOfBirth: req.user.profile.dateOfBirth,
    preferredLanguage: req.user.profile.preferredLanguage,
    preferences: req.user.preferences,
  });
});

/**
 * Erases every Mongo document owned by this user, then deletes the Firebase account
 * itself — in that order, deliberately. Mongo holds the actually-sensitive stuff
 * (period history, AI chat turns); Firebase just holds the login. If the Firebase
 * delete below ever fails after the Mongo side succeeds, the account technically still
 * exists but is unable to reach any of its old data (a fresh login just self-heals a
 * blank User doc, same as any first-time sign-in) — the safer failure mode for a
 * "delete my personal data" request than the reverse order, where a failed Mongo
 * cleanup would leave real health data orphaned with no owner able to reach it.
 *
 * Not wrapped in a Mongo transaction — these three `deleteMany` calls are independent
 * (no cross-collection references to keep consistent), so a partial failure just means
 * a retry finishes the job rather than leaving inconsistent state.
 */
const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { firebaseUid } = req.user;

  await Promise.all([
    MenstrualRecord.deleteMany({ userId }),
    AIConversation.deleteMany({ userId }),
    NotificationReminder.deleteMany({ userId }),
  ]);
  await User.deleteOne({ _id: userId });

  try {
    await getAuth(firebaseApp).deleteUser(firebaseUid);
  } catch (err) {
    // Mongo's already clean at this point — the user's personal data is gone even if
    // this last step fails, which is the deliberate tradeoff described above. Logged
    // so a dangling Firebase account (one with no matching Mongo doc) can be found and
    // cleaned up manually if this ever actually happens.
    console.error(`[profile] Mongo data deleted for user ${userId}, but Firebase deleteUser(${firebaseUid}) failed:`, err.message);
    throw err;
  }

  return successMessage(res, "User account and all associated personal data have been permanently deleted.");
});

// Body validated by validate(pushTokenSchema) in profileRoutes.js. Storage only —
// there's no FCM/Expo push *delivery* wired up yet (see reminderRoutes.js's "no push
// delivery yet" note); this is the missing piece delivery would eventually read to
// know which device to actually notify. Always overwrites rather than merging, since a
// device only ever has one current token — the previous one (if any) is simply stale.
const savePushToken = asyncHandler(async (req, res) => {
  req.user.device.expoPushToken = req.body.expoPushToken;
  req.user.device.pushTokenUpdatedAt = new Date();
  await req.user.save();

  return successMessage(res, "Push token saved.");
});

/**
 * Full personal-data export: profile fields + every logged MenstrualRecord. Scoped to
 * just those two, not AI chat history or reminders — DELETE /api/profile/me is the one
 * that erases everything; this is "let me see/take my data", not "delete my data".
 * Sent as a file download (Content-Disposition) rather than rendered inline, though the
 * response body underneath is still the same {status,data} envelope as everywhere else.
 */
const exportData = asyncHandler(async (req, res) => {
  const records = await MenstrualRecord.find({ userId: req.user._id }).sort({ date: 1 });

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: {
      userId: req.user._id,
      name: req.user.profile.name,
      email: req.user.email,
      age: req.user.profile.age,
      dateOfBirth: req.user.profile.dateOfBirth,
      preferredLanguage: req.user.profile.preferredLanguage,
      preferences: req.user.preferences,
      onboarding: req.user.onboarding,
      cycle: req.user.cycle,
    },
    menstrualRecords: records,
  };

  const filename = `mira-export-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return success(res, payload);
});

module.exports = { getMe, updateMe, deleteMe, savePushToken, exportData };
