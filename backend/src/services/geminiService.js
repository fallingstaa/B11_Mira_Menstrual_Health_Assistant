const { GoogleGenAI } = require("@google/genai");
const { wrapAIServiceError } = require("../utils/aiServiceError");

// gemini-3.6-flash (the full Flash model) turned out to carry only a 20-requests/day
// free quota — discovered by hitting it during real testing, not documented anywhere
// obvious. gemini-3.5-flash-lite has a much more generous free daily allowance and,
// re-verified directly (both the fabricated-fact groundedness test and a real-question
// quality check), follows the grounding/tone instructions just as reliably. Kept
// deliberately different from safetyService.js's classifier model (gemini-3.1-flash-
// lite) — Google tracks free-tier limits per model, so the two still don't compete for
// the same daily allowance.
const GENERATION_MODEL = "gemini-3.5-flash-lite";

// Returned verbatim, with no Gemini call at all, whenever ragService.js found nothing
// relevant (see the empty-context guard in generateReply below). Deliberately the same
// wording as the system prompt's own instruction for a partial-context "I don't know"
// case, so the tone is identical regardless of which path produced it.
const NO_CONTEXT_REPLY =
  "I don't have verified information about that in my current sources yet. It's best to ask a trusted adult, teacher, or doctor about this one!";

// Response-style fix, round 3: round 2 (see git history) only eased off from the 3rd question
// onward — the actual rule is narrower still: full comfort/reassurance on the user's 1st question
// in a session only; from the 2nd question on, that comfort opener is *minimized* (never fully
// removed) so it doesn't repeat every single answer, UNLESS that particular question itself
// sounds nervous/serious/emotionally loaded, in which case full comfort comes back regardless of
// turn number — the minimizing is a *default*, not a hard cap. `turnNumber` (this question's
// position among this user's questions in the current session — see aiController.js) drives the
// default: 1 gets the original tone paragraph unchanged; 2+ gets it plus the addendum below,
// which itself carves out the serious-question exception rather than blocking it.
const BASE_SYSTEM_PROMPT = `You are Mira, a warm and supportive health-education assistant inside a menstrual health app for teenage girls in Cambodia.

Answer the user's question using ONLY the reference material provided below. Do not use any other knowledge, even if you already know more about the topic — only the material given to you counts as trustworthy here.

If the reference material does not contain enough information to answer the question, say so honestly instead of guessing — for example: "I don't have verified information about that yet. It's best to ask a trusted adult, teacher, or doctor."

Keep your tone warm, encouraging, and extra polite — like a caring older sister who has all the time in the world for this conversation. Start by gently acknowledging how the user might be feeling before sharing the facts, avoid clinical jargon, and never make the user feel embarrassed or ashamed for asking. Write a fuller, more complete answer — aim for around two short paragraphs (roughly 5 to 8 sentences total) so the user feels genuinely supported and informed, not rushed through a one-liner.

You are not a doctor. Do not diagnose conditions or recommend specific medications or dosages. For anything that sounds serious or medical, gently suggest talking to a trusted adult or healthcare professional.`;

// Appended from the user's 2nd question onward in the same session — they've already had the
// full comfort/reassurance opener once by then, so leading with it again on every answer starts
// to feel repetitive rather than caring. Minimizes it as a default, not a removal, and explicitly
// carves out serious-sounding questions so real comfort is never withheld when it's actually needed.
const LATER_TURN_ADDENDUM = `

This is not the user's first question this session — they've already been warmly greeted and reassured once. By default, minimize the emotional comfort/reassurance opening for this answer: lead with the actual answer instead of gently acknowledging feelings first, and keep it a bit more concise. The one exception: if THIS specific question sounds nervous, worried, embarrassed, or emotionally serious, set the default aside and give it the full warm, reassuring treatment regardless — minimizing comfort is only for ordinary factual follow-up questions, never for a question that actually needs it.`;

function buildSystemPrompt(turnNumber) {
  return turnNumber >= 2 ? BASE_SYSTEM_PROMPT + LATER_TURN_ADDENDUM : BASE_SYSTEM_PROMPT;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generates Mira's reply to `question`, grounded strictly in `context` (the text
 * ragService.retrieveContext already retrieved and score-filtered). Per Security
 * Design 14.5, only `question`/`context` ever reach Gemini — never the user's name,
 * email, or any other identifying detail (aiController.js's job, not this function's,
 * but worth restating here since this is the actual boundary that policy protects).
 *
 * `turnNumber` is this question's position among the user's questions in the current session
 * (1 for their first question, 2 for their second, ...) — see aiController.js for how it's
 * counted. Only changes whether buildSystemPrompt appends the later-turn addendum; defaults to 1
 * (the full-warmth prompt) so an existing/omitted caller behaves exactly as before.
 */
async function generateReply(question, context, turnNumber = 1) {
  // No Gemini call at all when nothing relevant was retrieved — a guaranteed-safe,
  // zero-cost, zero-hallucination-risk response by construction, rather than trusting
  // the prompt alone to stop the model from guessing when handed nothing to work with.
  if (!context) {
    return NO_CONTEXT_REPLY;
  }

  const prompt = `Reference material:\n${context}\n\nQuestion: ${question}`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: { systemInstruction: buildSystemPrompt(turnNumber) },
    });
  } catch (err) {
    throw wrapAIServiceError(err, "geminiService.generateReply");
  }

  return response.text;
}

module.exports = { generateReply };
