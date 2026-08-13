/**
 * Placeholder AI reply generator. Returns a canned response so POST /api/ai/ask is
 * fully functional end-to-end (creates a real AIConversation record) before the real
 * Gemini call is wired in. Mirrors the frontend's own prototype fallback in
 * assistant.tsx's generateReply().
 */
async function generateReply(question, context) {
  // TODO: call the Gemini API here (GEMINI_API_KEY is already in .env) with `question`
  // and `context` as grounding, and return its text response instead. Per Security
  // Design 14.5, only send the question/context — never the user's name or email.
  return "That's a great question! Mira's AI is still being connected on the backend — check back soon for a real, personalized answer.";
}

module.exports = { generateReply };
