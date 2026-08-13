const { success } = require("../utils/responseHandler");
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

module.exports = { getMe, updateMe };
