/**
 * Placeholder AI reply generator. Returns a canned response so POST /api/ai/ask is
 * fully functional end-to-end (creates a real AIConversation record) before the real
 * Gemini call is wired in. Mirrors the frontend's own prototype fallback in
 * assistant.tsx's generateReply().
 */
async function generateReply(question, context) {
  // No Gemini call at all when nothing relevant was retrieved — a guaranteed-safe,
  // zero-cost, zero-hallucination-risk response by construction, rather than trusting
  // the prompt alone to stop the model from guessing when handed nothing to work with.
  if (!context) {
    return NO_CONTEXT_REPLY;
  }

  const prompt = `Reference material:\n${context}\n\nQuestion: ${question}`;

  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT },
  });

  return response.text;
}

module.exports = { generateReply };
