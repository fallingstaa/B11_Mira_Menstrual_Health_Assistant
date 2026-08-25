// Thrown whenever a call to Gemini itself fails — quota/credit exhausted, a transient
// outage, a network blip. Without this, the raw SDK error (an ugly JSON blob like
// `{"error":{"code":429,"message":"You exceeded your current quota..."}}`) would
// propagate untouched through asyncHandler.js -> errorHandler.js and land verbatim in
// the chat bubble on mobile, as if Mira had "said" it. This wraps it into one clean,
// friendly message before that ever happens, while still logging the real cause
// server-side so the actual failure isn't lost for debugging.
//
// Used at every Gemini call site: ragService.js (embedding), geminiService.js
// (generation), safetyService.js (classification). See Risk Controls: "AI service
// unavailable" — this is what makes that row actually true instead of aspirational.
function wrapAIServiceError(err, context) {
  console.error(`Gemini call failed (${context}):`, err);

  const friendly = new Error(
    "Mira's AI helper is temporarily unavailable — please try again in a moment."
  );
  friendly.statusCode = 503;
  friendly.code = "AI_UNAVAILABLE";
  return friendly;
}

module.exports = { wrapAIServiceError };
