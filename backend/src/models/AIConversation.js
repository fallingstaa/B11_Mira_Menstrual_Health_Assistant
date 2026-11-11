const mongoose = require("mongoose");

/**
 * One document per question/answer exchange with Yumi, not one growing document per
 * user — avoids the unbounded-embedded-array anti-pattern a single "messages[]" field
 * would hit over the life of an account. The full thread is reconstructed by querying
 * userId, sorted by createdAt (assistant.tsx has one continuous thread, no multi-
 * conversation UI, so there's no need for a separate conversationId yet).
 */
const aiConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true, maxlength: 2000 },
    // The English wording actually used for retrieval (the classifier's translation for a
    // Khmer question; the question itself for English) and the language Yumi answered in —
    // kept so retrieval quality can be compared across languages later.
    searchQuery: { type: String, maxlength: 2000 },
    language: { type: String, enum: ["en", "km"], default: "en" },
    retrievedContext: { type: String, default: "" },
    aiResponse: { type: String, required: true },
    sourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "KnowledgeSource" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("AIConversation", aiConversationSchema);
