const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");

const firebaseApp = require("../../config/firebase");
const MenstrualRecord = require("../models/MenstrualRecord");
const AIConversation = require("../models/AIConversation");
const NotificationReminder = require("../models/NotificationReminder");
const User = require("../models/User");
const { success, successMessage, error } = require("../utils/responseHandler");
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
    avatarUrl: u.profile.avatarUrl,
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
  const { name, age, dateOfBirth, preferredLanguage, avatarUrl, preferences } = req.body;

  if (name !== undefined) req.user.profile.name = name;
  if (age !== undefined) req.user.profile.age = age;
  if (dateOfBirth !== undefined) req.user.profile.dateOfBirth = dateOfBirth;
  if (preferredLanguage !== undefined) req.user.profile.preferredLanguage = preferredLanguage;
  // avatarUrl is nullable (see updateProfileSchema) — `null` explicitly clears a
  // previously-set photo, distinct from omitting the key entirely (leave unchanged).
  if (avatarUrl !== undefined) req.user.profile.avatarUrl = avatarUrl;
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
    avatarUrl: req.user.profile.avatarUrl,
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
 * Changes the signed-in user's login email. A separate endpoint from updateMe on
 * purpose — this is the one profile field that isn't just a Mongo write, it has to
 * touch Firebase Auth (the actual source of truth for how the user signs in) too.
 *
 * Firebase is updated first, Mongo second, deliberately: if the Mongo save were to
 * fail right after Firebase already succeeded, the user can still log in fine under
 * their new email (Firebase is authoritative there) and just has a stale-looking
 * email on their profile until the next successful save. The reverse order is worse —
 * a failed Firebase update after Mongo already succeeded would show the new email in
 * the app while actually locking the user out under their old one, since Firebase
 * never got the memo.
 *
 * The Mongo uniqueness check up front is a fast, cheap rejection for the common case;
 * Firebase's own "auth/email-already-exists" is the real backstop in case Mongo
 * doesn't know about a Firebase-only account (e.g. a self-heal case, see login()).
 *
 * No verification-link step yet — same "not actually wired up" gap as
 * authController.js's forgotPassword TODO. This takes effect immediately, unlike a
 * production auth flow that would normally confirm the new address first.
 */
const changeEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (email === req.user.email) {
    return success(res, { userId: req.user._id, email: req.user.email });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return error(res, "That email is already in use by another account", 409);
  }

  try {
    await getAuth(firebaseApp).updateUser(req.user.firebaseUid, { email });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      return error(res, "That email is already in use by another account", 409);
    }
    if (err.code === "auth/invalid-email") {
      return error(res, "That doesn't look like a valid email address", 400);
    }
    throw err;
  }

  req.user.email = email;
  await req.user.save();

  return success(res, { userId: req.user._id, email: req.user.email });
});

// Every avatar route below shares one fixed Storage path per user (no filename/
// timestamp in it) — a fresh upload always overwrites the same object rather than
// accumulating a new one per upload, so there's never a separate "delete the old one"
// step to forget and no extra field needed to track which path is current.
function avatarStoragePath(userId) {
  return `avatars/${userId}`;
}

/**
 * Saves/replaces the signed-in user's profile photo in Firebase Storage, then points
 * profile.avatarUrl at this same API's own GET /api/profile/avatar — not a raw Google
 * Cloud Storage URL. Two things made that the simpler call over the alternatives:
 *  - Making the object public (bucket ACL) can outright fail on a bucket with Uniform
 *    Bucket-Level Access enabled (the default for newer Firebase Storage buckets), and
 *    would otherwise leave the photo world-readable by anyone with the URL — no auth.
 *  - A signed URL avoids that, but Google Cloud Storage caps V4 signed URLs at 7 days;
 *    unusable for something meant to just keep working indefinitely.
 * Proxying through our own already-authenticated endpoint sidesteps both: no bucket
 * ACL config to get right, no expiry to refresh, and it's already access-controlled
 * (see getAvatar below) the same way every other profile field already is.
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  const bucket = getStorage(firebaseApp).bucket();
  const file = bucket.file(avatarStoragePath(req.user._id));

  await file.save(req.file.buffer, {
    metadata: { contentType: req.file.mimetype },
    resumable: false, // a single ≤5MB request-body buffer, not worth resumable upload's overhead
  });

  // req.get("host") reflects whichever host:port the client actually used to reach
  // this server (localhost for the simulator, a LAN IP for a physical device over
  // Expo Go — same value mobile-app's own EXPO_PUBLIC_API_URL would already be set
  // to), so this resolves correctly in dev without hardcoding a public domain this
  // backend doesn't have yet. Would need `app.set("trust proxy", ...)` to stay correct
  // once this ever sits behind a real reverse proxy/load balancer.
  const avatarUrl = `${req.protocol}://${req.get("host")}/api/profile/avatar`;
  req.user.profile.avatarUrl = avatarUrl;
  await req.user.save();

  return success(res, { avatarUrl });
});

/**
 * Streams the signed-in user's own avatar back — never anyone else's; there's no
 * :userId in this route at all, same "always req.user, never a param" shape as
 * GET /api/profile/me. 404s (not an empty 200) when nothing's been uploaded yet, so a
 * client can tell "no photo set" apart from "something went wrong loading it".
 */
const getAvatar = asyncHandler(async (req, res) => {
  const bucket = getStorage(firebaseApp).bucket();
  const file = bucket.file(avatarStoragePath(req.user._id));

  const [exists] = await file.exists();
  if (!exists) return error(res, "No avatar set for this account", 404);

  const [metadata] = await file.getMetadata();
  res.setHeader("Content-Type", metadata.contentType || "application/octet-stream");
  // Fine to cache briefly client-side — a fresh upload overwrites this same path, so a
  // long/forever cache would risk showing a stale photo after a real change.
  res.setHeader("Cache-Control", "private, max-age=300");

  file.createReadStream().on("error", (err) => {
    console.error("[profile] avatar stream error:", err.message);
    if (!res.headersSent) error(res, "Failed to load avatar", 500);
  }).pipe(res);
});

/**
 * Removes the signed-in user's avatar — deletes the Storage object and clears
 * profile.avatarUrl together, so the two can never drift out of sync (a URL pointing
 * at a since-deleted file, or a file with nothing referencing it anymore).
 */
const deleteAvatar = asyncHandler(async (req, res) => {
  const bucket = getStorage(firebaseApp).bucket();
  const file = bucket.file(avatarStoragePath(req.user._id));

  try {
    await file.delete();
  } catch (err) {
    // Already gone (e.g. a retried request, or it was never actually uploaded despite
    // avatarUrl somehow being set) is fine — anything else genuinely failed.
    if (err.code !== 404) throw err;
  }

  req.user.profile.avatarUrl = null;
  await req.user.save();

  return successMessage(res, "Avatar removed.");
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
      avatarUrl: req.user.profile.avatarUrl,
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

module.exports = { getMe, updateMe, deleteMe, savePushToken, changeEmail, uploadAvatar, getAvatar, deleteAvatar, exportData };
