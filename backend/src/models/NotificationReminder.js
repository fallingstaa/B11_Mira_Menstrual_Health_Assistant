const mongoose = require("mongoose");

/** One document per notification/reminder instance shown to a user. */
const notificationReminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["period", "record", "checkin", "education"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    // Only set for type "education" — links back to the article it's about.
    relatedContentId: { type: mongoose.Schema.Types.ObjectId, ref: "EducationalContent", default: null },
    scheduledFor: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("NotificationReminder", notificationReminderSchema);
