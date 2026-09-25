const mongoose = require("mongoose");

// Profile photo bytes, kept in their own collection rather than on the User doc — User
// gets loaded on every authenticated request (authMiddleware), and dragging up to 5MB of
// image data along with it each time would be wasteful. One doc per user (unique userId),
// so a new upload replaces the old one in place with no history/cleanup step.
const avatarSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Avatar", avatarSchema);
