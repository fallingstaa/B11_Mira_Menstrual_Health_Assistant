/**
 * Khmer retrieval evaluation — does a Khmer question find the same knowledge as its English twin?
 *
 * For each of the 20 question pairs below it runs three searches against the real knowledge base:
 *   EN       — the English question, embedded directly (the baseline)
 *   KM raw   — the Khmer question, embedded directly (how it worked before Khmer support)
 *   KM → EN  — the Khmer question translated by safetyService.checkQuestion (what the app does now)
 * and reports each one's best match score, whether it clears ragService's 0.78 threshold, and
 * whether its best chunk is the same one the English question found.
 *
 * Cost: 20 classifier requests (one per Khmer question) + 60 embedding requests.
 *
 * Usage (from backend/):  node scripts/eval-khmer-retrieval.js
 *   Set USE_PUBLIC_DNS=1 if your network's DNS can't resolve the Atlas SRV record.
 */
if (process.env.USE_PUBLIC_DNS) require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const { checkQuestion } = require("../src/services/safetyService");

const THRESHOLD = 0.78; // same as ragService.js's RELEVANCE_THRESHOLD
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const QUESTIONS = [
  ["At what age do most girls get their first period?", "ក្មេងស្រីភាគច្រើនមករដូវដំបូងនៅអាយុប៉ុន្មាន?"],
  ["Why do I get cramps during my period?", "ហេតុអ្វីខ្ញុំឈឺពោះពេលមករដូវ?"],
  ["How can I relieve period cramps at home?", "តើខ្ញុំអាចបំបាត់ការឈឺពោះរដូវនៅផ្ទះដោយរបៀបណា?"],
  ["How often should I change my pad?", "តើខ្ញុំគួរប្តូរសំឡីអនាម័យប៉ុន្មានម៉ោងម្តង?"],
  ["Can I swim during my period?", "តើខ្ញុំអាចហែលទឹកពេលមករដូវបានទេ?"],
  ["Is white vaginal discharge normal?", "តើទឹករំអិលពណ៌សចេញពីទ្វារមាសជារឿងធម្មតាទេ?"],
  ["How long is a normal menstrual cycle?", "តើវដ្តរដូវធម្មតាមានរយៈពេលប៉ុន្មានថ្ងៃ?"],
  ["Is it normal for my periods to be irregular as a teenager?", "តើរដូវមិនទៀងទាត់ជារឿងធម្មតាសម្រាប់ក្មេងជំទង់ទេ?"],
  ["When is period bleeding too heavy?", "តើពេលណាដែលឈាមរដូវចេញច្រើនពេក?"],
  ["What is PMS?", "តើ PMS ជាអ្វី?"],
  ["Is it okay to exercise during my period?", "តើហាត់ប្រាណពេលមករដូវបានទេ?"],
  ["Can I wash my hair during my period?", "តើខ្ញុំអាចកក់សក់ពេលមករដូវបានទេ?"],
  ["Does eating cold or sour food stop my period?", "តើញ៉ាំអាហារត្រជាក់ ឬជូរ ធ្វើឱ្យឈាមរដូវឈប់ហូរមែនទេ?"],
  ["What should I do if I leak at school?", "ខ្ញុំគួរធ្វើដូចម្តេច បើឈាមរដូវជ្រាបនៅសាលា?"],
  ["What is toxic shock syndrome?", "តើរោគសញ្ញាឆក់ដោយជាតិពុល (TSS) ជាអ្វី?"],
  ["What are the signs of anemia from heavy periods?", "តើសញ្ញានៃភាពស្លេកស្លាំងដោយសារឈាមរដូវច្រើនមានអ្វីខ្លះ?"],
  ["What happens during ovulation?", "តើមានអ្វីកើតឡើងពេលពងអូវុលចេញ?"],
  ["How do I throw away a used pad?", "តើត្រូវបោះចោលសំឡីអនាម័យដែលប្រើរួចដោយរបៀបណា?"],
  ["What foods help with period cramps?", "តើអាហារអ្វីខ្លះជួយបន្ធូរការឈឺពោះរដូវ?"],
  ["I haven't had my period for three months, is that normal?", "ខ្ញុំមិនមករដូវបីខែហើយ តើធម្មតាទេ?"],
];

async function search(collection, text) {
  const { embeddings } = await ai.models.embedContent({ model: "gemini-embedding-001", contents: text });
  const hits = await collection
    .aggregate([
      { $vectorSearch: { index: "vector_index", path: "embedding", queryVector: embeddings[0].values, numCandidates: 100, limit: 3 } },
      { $project: { _id: 1, score: { $meta: "vectorSearchScore" } } },
    ])
    .toArray();
  return { top: hits[0]?.score ?? 0, topId: String(hits[0]?._id ?? "") };
}

const fmt = (r, en) => `${r.top.toFixed(3)} ${r.top >= THRESHOLD ? "✓" : "✗"}${r.topId === en.topId ? " =" : "  "}`;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const chunks = mongoose.connection.db.collection("knowledgechunks");
  const totals = { en: 0, raw: 0, tr: 0, rawSame: 0, trSame: 0 };

  console.log("score ✓ = clears 0.78   '=' = same best chunk as the English question\n");
  console.log("#   EN         KM raw     KM → EN    translated question");
  for (const [i, [en, km]] of QUESTIONS.entries()) {
    try {
      const enRes = await search(chunks, en);
      const rawRes = await search(chunks, km);
      const { searchQuery } = await checkQuestion(km);
      const trRes = await search(chunks, searchQuery);

      totals.en += enRes.top >= THRESHOLD;
      totals.raw += rawRes.top >= THRESHOLD;
      totals.tr += trRes.top >= THRESHOLD;
      totals.rawSame += rawRes.topId === enRes.topId;
      totals.trSame += trRes.topId === enRes.topId;
      console.log(
        `${String(i + 1).padStart(2)}  ${enRes.top.toFixed(3)} ${enRes.top >= THRESHOLD ? "✓" : "✗"}    ${fmt(rawRes, enRes)}  ${fmt(trRes, enRes)}  ${searchQuery}`
      );
    } catch (err) {
      console.log(`${String(i + 1).padStart(2)}  ERROR: ${err.message}`);
    }
  }

  const n = QUESTIONS.length;
  console.log(`\nCleared threshold:   EN ${totals.en}/${n}   KM raw ${totals.raw}/${n}   KM → EN ${totals.tr}/${n}`);
  console.log(`Same chunk as EN:                 KM raw ${totals.rawSame}/${n}   KM → EN ${totals.trSame}/${n}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
