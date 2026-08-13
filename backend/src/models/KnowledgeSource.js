const mongoose = require("mongoose");

/**
 * Reference material backing both EducationalContent articles and the AI assistant's
 * RAG-grounded answers (see AIConversation.sourceIds). Shared/public data — not owned
 * by any single user.
 */
const knowledgeSourceSchema = new mongoose.Schema({
  sourceName: { type: String, required: true },
  sourceUrl: { type: String, default: "" },
  description: { type: String, default: "" },
  referenceDate: { type: Date, default: null },
});

module.exports = mongoose.model("KnowledgeSource", knowledgeSourceSchema);
