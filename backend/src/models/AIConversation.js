const mongoose = require("mongoose");

/**
 * One document per question/answer exchange with Mira, not one growing document per
 * user — avoids the unbounded-embedded-array anti-pattern a single "messages[]" field
 * would hit over the life of an account. The full thread is reconstructed by querying
 * userId, sorted by createdAt (assistant.tsx has one continuous thread, no multi-
 * conversation UI, so there's no need for a separate conversationId yet).
 */
const aiConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true, maxlength: 2000 },
    retrievedContext: { type: String, default: "" },
    aiResponse: { type: String, required: true },
    sourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "KnowledgeSource" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("AIConversation", aiConversationSchema);
