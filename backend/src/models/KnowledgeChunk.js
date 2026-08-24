const mongoose = require("mongoose");

/**
 * One document per retrievable chunk of the RAG knowledge base — the actual searchable
 * unit `ragService.js` queries against, distinct from `KnowledgeSource` (one doc per
 * distinct reference article/page, shared across every chunk pulled from it).
 *
 * `embedding` is a Gemini `gemini-embedding-001` vector (3072 dimensions, the model's
 * default — see seed-knowledge-base.js for why we don't truncate it) — MongoDB Atlas
 * Vector Search is what actually searches this field; nothing in application code
 * computes similarity itself. topic is left as a free string, not an enum, the same
 * way MenstrualRecord.flowLevel stays free-form while its option set is still being
 * tuned rather than finalized.
 */
const knowledgeChunkSchema = new mongoose.Schema(
  {
    // Human-readable id from the source spreadsheet (ex "CC-001") — not used by any
    // query, purely so a given chunk can be traced back to its row for debugging/edits.
    chunkKey: { type: String, required: true, unique: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "KnowledgeSource", required: true },
    topic: { type: String, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
