const { GoogleGenAI } = require("@google/genai");

// Deliberately a *different* model than geminiService.js's answer-writing call
// (gemini-3.5-flash-lite) — Google's free-tier limits are tracked per model, both per
// minute and per day (confirmed by separately hitting a 5-requests/minute limit and,
// later, a 20-requests/day limit during testing), so sharing one model between
// classify and generate would mean every single /api/ai/ask call burns two requests
// against the same daily allowance instead of one against each of two.
const CLASSIFIER_MODEL = "gemini-3.1-flash-lite";

const CLASSIFIER_PROMPT = `You are a strict content classifier for a teen menstrual health education app.

Determine whether the user's question is asking for either of the following:
(a) A medical diagnosis of the user's own symptoms (e.g. "what disease do I have", "what's wrong with me", "is this cancer")
(b) A specific medication, drug, or dosage recommendation (e.g. "what dosage of ibuprofen should I take", "can I take birth control to stop my period")

General health education questions are ALLOWED, even when they touch on symptoms, when to see a doctor, or the general safety of common remedies — for example "why do I get cramps", "when should I see a doctor about my period", and "is heat safe for period pain" are all ALLOWED. Only block requests asking to diagnose the user personally, or asking for a specific medication/dosage decision.

Respond with exactly one word: BLOCK or ALLOW.`;

/**
 * Shown instead of a generated answer whenever isUnsafeQuestion() flags a question —
 * distinct wording from geminiService.js's NO_CONTEXT_REPLY on purpose: that one means
 * "I don't have information on this," this one means "I'm choosing not to answer this
 * directly," which is a different message to send.
 */
const SAFETY_DISCLAIMER =
  "That's something best answered by a real doctor or trusted adult, not me — I'm not able to diagnose symptoms or recommend medications or dosages. Please reach out to a doctor, school nurse, or someone you trust so they can help you properly with this one!";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Runs *before* retrieval/generation even start (see aiController.js) — a question
 * flagged here never touches the knowledge base or the answer-writing model at all,
 * the same "safe by construction" principle as geminiService.js's empty-context skip.
 */
async function isUnsafeQuestion(question) {
  const response = await ai.models.generateContent({
    model: CLASSIFIER_MODEL,
    contents: question,
    config: { systemInstruction: CLASSIFIER_PROMPT },
  });

  return response.text.trim().toUpperCase().startsWith("BLOCK");
}

module.exports = { isUnsafeQuestion, SAFETY_DISCLAIMER };
