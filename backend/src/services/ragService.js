const { GoogleGenAI } = require("@google/genai");

const KnowledgeChunk = require("../models/KnowledgeChunk");

// Same model used to embed the knowledge base itself in scripts/seed-knowledge-base.js
// — a question embedded with a different model would land in a different, incompatible
// "map," making similarity search meaningless.
const EMBEDDING_MODEL = "gemini-embedding-001";
// Must match the index name created in Atlas (see scripts/seed-knowledge-base.js's
// header comment / the setup guide) — a typo here fails silently-ish (Mongo just
// returns zero results, not a clear "index not found" error).
const VECTOR_INDEX_NAME = "vector_index";

// How many candidates to retrieve before filtering, and the score floor a chunk must
// clear to actually be used. Calibrated empirically, not guessed: real on-topic
// questions against this knowledge base scored ~0.84-0.90 cosine similarity, while
// genuinely unrelated questions ("what's the capital of France", "fix my wifi router")
// scored ~0.73-0.76 — 0.78 sits in the gap between those two clusters. Revisit this
// once more real usage data exists; a 30-chunk knowledge base this narrow in topic
// (everything here is already about menstrual health) compresses scores more than a
// broad, general-purpose corpus would.
const TOP_K = 3;
const RELEVANCE_THRESHOLD = 0.78;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Embeds `question` with the same model/space the knowledge base was built in, runs
 * MongoDB Atlas Vector Search for the closest chunks, and drops anything too weak a
 * match to trust. Returns `{ context: "", sourceIds: [] }` — the same shape the old
 * stub always returned — when nothing clears the bar, so a genuinely out-of-scope
 * question (nothing in these 30 chunks addresses it) is distinguishable from "the
 * knowledge base has an answer" by callers, rather than always handing back its top 3
 * regardless of how irrelevant they are. That distinction is what the safety/refusal
 * logic (still to be built) will branch on.
 */
async function retrieveContext(question) {
  const { embeddings } = await ai.models.embedContent({ model: EMBEDDING_MODEL, contents: question });
  const queryVector = embeddings[0].values;

  const candidates = await KnowledgeChunk.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector,
        numCandidates: 100,
        limit: TOP_K,
      },
    },
    {
      $project: {
        text: 1,
        sourceId: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  const relevant = candidates.filter((c) => c.score >= RELEVANCE_THRESHOLD);
  if (relevant.length === 0) {
    return { context: "", sourceIds: [] };
  }

  // Joined as plain paragraphs, not labeled/numbered — geminiService.js's prompt is
  // what will decide how to present this to the model; keeping this just the raw
  // retrieved material means that prompt design can change freely without this
  // function needing to change too.
  const context = relevant.map((c) => c.text).join("\n\n");

  // Order preserved (most relevant first), duplicates removed — two chunks from the
  // same KnowledgeSource shouldn't cite that source twice.
  const seen = new Set();
  const sourceIds = [];
  for (const c of relevant) {
    const id = c.sourceId.toString();
    if (seen.has(id)) continue;
    seen.add(id);
    sourceIds.push(c.sourceId);
  }

  return { context, sourceIds };
}

module.exports = { retrieveContext };
