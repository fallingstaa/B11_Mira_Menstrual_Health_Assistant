/**
 * Loads the knowledge base: reads the CSV, gets embeddings from Gemini, saves it all
 * to Mongo. Turns the spreadsheet into something ragService.js can actually search.
 *
 * Safe to re-run — clears old data first, so just re-run after editing the CSV.
 *
 * npm run seed:kb   (from backend/)
 */
require("dotenv").config({ quiet: true });

const fs = require("fs");
const path = require("path");

const { parse } = require("csv-parse/sync");
const { GoogleGenAI } = require("@google/genai");
const mongoose = require("mongoose");

// Using the server's connectDB, not a plain mongoose.connect() — it already handles a
// local DNS issue with Atlas (see its comment).
const connectDB = require("../config/database");
const KnowledgeSource = require("../src/models/KnowledgeSource");
const KnowledgeChunk = require("../src/models/KnowledgeChunk");

const CSV_PATH = path.join(__dirname, "../data/knowledge-base.csv");
// Using the default embedding size (3072 numbers), not a smaller one — smaller sizes
// need manual normalizing to work right, and with 30 chunks there's no need to bother.
const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * source_url in the CSV is a pasted markdown link — "[url](url)" as plain text.
 * Just grabs the one inside the parentheses.
 */
function extractUrl(raw) {
  const match = raw.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : raw.trim();
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from backend/.env");
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from backend/.env");
  }

  const csvText = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parse(csvText, { columns: true, skip_empty_lines: true }).filter(
    (r) => r.chunk_id && r.chunk_id.trim()
  ); // drops the blank row the export left behind

  console.log(`[seed] Loaded ${rows.length} chunk rows from ${CSV_PATH}`);

  await connectDB();

  await KnowledgeChunk.deleteMany({});
  await KnowledgeSource.deleteMany({});
  console.log("[seed] Cleared existing KnowledgeSource/KnowledgeChunk documents");

  // One source per name+url, not just per name — Cleveland Clinic and ACOG each link
  // to two different articles here, so grouping by name alone would cite the wrong page.
  const sourceIdByKey = new Map();
  for (const row of rows) {
    const name = row.source_name.trim();
    const url = extractUrl(row.source_url);
    const key = `${name}|${url}`;
    if (sourceIdByKey.has(key)) continue;

    const source = await KnowledgeSource.create({ sourceName: name, sourceUrl: url });
    sourceIdByKey.set(key, source._id);
  }
  console.log(`[seed] Created ${sourceIdByKey.size} KnowledgeSource documents`);

  // All 30 chunks in one request instead of one at a time — faster, and well within
  // any size limit.
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const texts = rows.map((r) => r.text.trim());
  console.log(`[seed] Requesting embeddings for ${texts.length} chunks from Gemini...`);
  const { embeddings } = await ai.models.embedContent({ model: EMBEDDING_MODEL, contents: texts });

  if (!embeddings || embeddings.length !== rows.length) {
    throw new Error(`Expected ${rows.length} embeddings back, got ${embeddings?.length ?? 0}`);
  }
  console.log("[seed] Embeddings received");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.source_name.trim();
    const url = extractUrl(row.source_url);
    const sourceId = sourceIdByKey.get(`${name}|${url}`);

    await KnowledgeChunk.create({
      chunkKey: row.chunk_id.trim(),
      sourceId,
      topic: row.topic.trim(),
      text: row.text.trim(),
      embedding: embeddings[i].values,
    });
  }
  console.log(`[seed] Created ${rows.length} KnowledgeChunk documents`);

  await mongoose.disconnect();
  console.log("[seed] Done.");
}

main()
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Without this, a failed run left Mongo connected on exit — harmless, but threw a
    // confusing crash message on Windows. Always disconnect either way.
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
