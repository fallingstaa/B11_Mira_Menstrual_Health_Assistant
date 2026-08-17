const mongoose = require("mongoose");

const NotificationReminder = require("../models/NotificationReminder");
const { success, error } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");
const { ensureRemindersUpToDate } = require("../services/notificationService");
const { toDayKey } = require("../utils/dateHelper");
const { resolveAsOf } = require("../utils/devClock");

const list = asyncHandler(async (req, res) => {
  // Lazily generates whatever's newly due (period-soon / daily check-in / unfinished-
  // period nudges) before listing — see notificationService.js for why this is a "just
  // in time" generate-on-read instead of a scheduler. ?asOf=YYYY-MM-DD (dev only, see
  // devClock.js) simulates a different "today" so the "N days before" window can be
  // tested on demand instead of waiting for the real calendar to reach it.
  await ensureRemindersUpToDate(req.user, toDayKey(resolveAsOf(req)));

  const reminders = await NotificationReminder.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return success(res, reminders);
});

const markRead = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return error(res, "Invalid reminder id", 400);
  }

  const reminder = await NotificationReminder.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );
  if (!reminder) return error(res, "Reminder not found", 404);

  return success(res, reminder);
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await NotificationReminder.updateMany(
    { userId: req.user._id, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  return res.json({
    status: "success",
    message: "All notifications marked as read.",
    updatedCount: result.modifiedCount,
  });
});

module.exports = { list, markRead, markAllRead };
