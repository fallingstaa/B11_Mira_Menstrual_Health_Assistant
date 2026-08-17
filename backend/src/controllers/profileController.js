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
    dateOfBirth: u.profile.dateOfBirth,
    preferredLanguage: u.profile.preferredLanguage,
    preferences: u.preferences,
    cycle: u.cycle,
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, dateOfBirth, preferredLanguage, preferences } = req.body;

  if (name !== undefined) req.user.profile.name = name;
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

module.exports = { getMe, updateMe, deleteMe };
