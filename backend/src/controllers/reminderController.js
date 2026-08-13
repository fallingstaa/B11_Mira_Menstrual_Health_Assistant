const NotificationReminder = require("../models/NotificationReminder");
const { success } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const reminders = await NotificationReminder.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return success(res, reminders);
});

const markRead = asyncHandler(async (req, res) => {
  const reminder = await NotificationReminder.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );
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
