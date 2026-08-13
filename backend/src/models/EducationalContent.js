const mongoose = require("mongoose");

/**
 * One document per Education-tab article. Deliberately minimal — presentation fields
 * (summary, read time, emoji, color) aren't finalized yet, so only the fields the API
 * design confirmed are included. Add the rest once that's settled.
 */
const educationalContentSchema = new mongoose.Schema(
  {
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "KnowledgeSource", default: null },
    title: { type: String, required: true },
    category: { type: String, required: true },
    body: { type: [String], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("EducationalContent", educationalContentSchema);
