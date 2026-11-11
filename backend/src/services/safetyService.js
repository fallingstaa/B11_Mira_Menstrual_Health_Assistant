const { GoogleGenAI } = require("@google/genai");
const { wrapAIServiceError } = require("../utils/aiServiceError");

// Deliberately a *different* model than geminiService.js's answer-writing call
// (gemini-3.5-flash-lite) — Google's free-tier limits are tracked per model, both per
// minute and per day (confirmed by separately hitting a 5-requests/minute limit and,
// later, a 20-requests/day limit during testing), so sharing one model between
// classify and generate would mean every single /api/ai/ask call burns two requests
// against the same daily allowance instead of one against each of two.
const CLASSIFIER_MODEL = "gemini-3.1-flash-lite";

// Used only when CLASSIFIER_MODEL itself is overloaded or rate-limited (503/429) —
// Google has had sustained "high demand" outages on gemini-3.1-flash-lite that made
// every /api/ai/ask fail even though the answer model was healthy. Falling back to the
// answer model costs one extra request against its allowance, but only in that case.
const FALLBACK_CLASSIFIER_MODEL = "gemini-3.5-flash-lite";

const CLASSIFIER_PROMPT = `You are a strict content classifier for a teen menstrual health education app.

Determine whether the user's question is asking for either of the following:
(a) A medical diagnosis of the user's own symptoms (e.g. "what disease do I have", "what's wrong with me", "is this cancer")
(b) A specific medication, drug, or dosage recommendation (e.g. "what dosage of ibuprofen should I take", "can I take birth control to stop my period")

General health education questions are ALLOWED, even when they touch on symptoms, when to see a doctor, or the general safety of common remedies — for example "why do I get cramps", "when should I see a doctor about my period", and "is heat safe for period pain" are all ALLOWED. Only block requests asking to diagnose the user personally, or asking for a specific medication/dosage decision.

The question may be written in English or Khmer — apply exactly the same rules to both.

Also translate the question into clear, natural English (if it is already English, repeat it unchanged). This English version is only used to search an English knowledge base, so keep its meaning exact and add nothing.

Respond with JSON only, in exactly this shape:
{"decision": "ALLOW" or "BLOCK", "english": "<the question in English>"}`;

/**
 * Shown (in the reply language) instead of a generated answer whenever checkQuestion() flags a question —
 * distinct wording from geminiService.js's NO_CONTEXT_REPLY on purpose: that one means
 * "I don't have information on this," this one means "I'm choosing not to answer this
 * directly," which is a different message to send.
 */
const SAFETY_DISCLAIMER = {
  en: "That's something best answered by a real doctor or trusted adult, not me — I'm not able to diagnose symptoms or recommend medications or dosages. Please reach out to a doctor, school nurse, or someone you trust so they can help you properly with this one!",
  km: "នេះជាសំណួរដែលវេជ្ជបណ្ឌិត ឬមនុស្សពេញវ័យដែលអ្នកទុកចិត្ត អាចឆ្លើយបានល្អជាងខ្ញុំ — ខ្ញុំមិនអាចធ្វើរោគវិនិច្ឆ័យ ឬណែនាំថ្នាំ ឬកម្រិតថ្នាំបានទេ។ សូមទាក់ទងវេជ្ជបណ្ឌិត គិលានុបដ្ឋាយិកាសាលា ឬនរណាម្នាក់ដែលអ្នកទុកចិត្ត ដើម្បីឱ្យពួកគេអាចជួយអ្នកបានត្រឹមត្រូវ!",
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Runs *before* retrieval/generation even start (see aiController.js) — a question
 * flagged here never touches the knowledge base or the answer-writing model at all,
 * the same "safe by construction" principle as geminiService.js's empty-context skip.
 */
function classify(model, question) {
  return ai.models.generateContent({
    model,
    contents: question,
    config: { systemInstruction: CLASSIFIER_PROMPT, responseMimeType: "application/json" },
  });
}

/**
 * Reads the classifier's `{"decision", "english"}` reply. Fails closed on the decision: if the
 * reply can't be parsed as JSON, any "BLOCK" in the raw text still blocks. The English search
 * text falls back to the original question, so retrieval still runs (just less well for Khmer).
 */
function parseClassifierReply(text, question) {
  const raw = (text || "").trim();
  let parsed = null;
  try {
    // Tolerates a ```json fence or stray text around the object.
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    parsed = JSON.parse(json);
  } catch {
    parsed = null;
  }

  const decision = typeof parsed?.decision === "string" ? parsed.decision.toUpperCase() : "";
  const unsafe = parsed ? decision.startsWith("BLOCK") : /\bBLOCK\b/i.test(raw);
  const english = typeof parsed?.english === "string" && parsed.english.trim() ? parsed.english.trim() : question;
  return { unsafe, searchQuery: english };
}

/** Overloaded (503) or rate-limited (429) — worth trying another model. */
function isCapacityError(err) {
  return err?.status === 503 || err?.status === 429;
}

/**
 * One Gemini call that does two jobs: the safety decision, and an English version of the
 * question for retrieval (the knowledge base is English, and Khmer questions match it less
 * strongly). Folded into the existing classifier call on purpose, so supporting Khmer adds
 * no extra request against the free-tier daily limit.
 * Returns `{ unsafe, searchQuery }`.
 */
async function checkQuestion(question) {
  let response;
  try {
    response = await classify(CLASSIFIER_MODEL, question);
  } catch (err) {
    if (!isCapacityError(err)) throw wrapAIServiceError(err, "safetyService.checkQuestion");
    console.warn(
      `Classifier ${CLASSIFIER_MODEL} unavailable (${err.status}), falling back to ${FALLBACK_CLASSIFIER_MODEL}`
    );
    try {
      response = await classify(FALLBACK_CLASSIFIER_MODEL, question);
    } catch (fallbackErr) {
      // Still fail closed: never answer a question that couldn't be safety-checked.
      throw wrapAIServiceError(fallbackErr, "safetyService.checkQuestion (fallback)");
    }
  }

  return parseClassifierReply(response.text, question);
}

module.exports = { checkQuestion, parseClassifierReply, SAFETY_DISCLAIMER };
