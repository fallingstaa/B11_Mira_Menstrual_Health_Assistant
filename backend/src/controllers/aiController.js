const AIConversation = require("../models/AIConversation");
// Not referenced directly below — required purely so its schema is registered with
// Mongoose before turn.populate("sourceIds") runs. Nothing else currently loaded at
// server startup requires this file, so without this line populate throws
// MissingSchemaError instead of quietly working.
require("../models/KnowledgeSource");
const { success, successMessage, error } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");
const { retrieveContext } = require("../services/ragService");
const { generateReply } = require("../services/geminiService");
const { isUnsafeQuestion, SAFETY_DISCLAIMER } = require("../services/safetyService");

// How long a gap in questions still counts as "the same conversation" for
// geminiService.js's turnNumber (see buildSystemPrompt there) — long enough that a normal
// back-and-forth stays one session, short enough that coming back tomorrow reads as a fresh
// one and gets the full warm greeting again, not the "later turn" style.
const SESSION_WINDOW_MS = 30 * 60 * 1000;

const ask = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) return error(res, "question is required", 400);

  // This question's position among this user's questions in the current session — 1 for their
  // first question in the last 30 minutes, 2 for their second, etc. (see SESSION_WINDOW_MS).
  // Purely a style signal for geminiService.js's buildSystemPrompt, nothing else reads this.
  const recentCount = await AIConversation.countDocuments({
    userId: req.user._id,
    createdAt: { $gte: new Date(Date.now() - SESSION_WINDOW_MS) },
  });
  const turnNumber = recentCount + 1;

  // Deliberately not sending req.user's name/email to the AI — only the question and
  // whatever the RAG layer retrieves (Security Design 14.5).
  //
  // Checked before retrieval/generation even run — a question asking for a personal
  // diagnosis or a specific medication/dosage never touches the knowledge base or the
  // answer-writing model at all (Feedback Item 2: safely handle diagnosis/medication
  // questions). context/sourceIds stay empty in this branch since nothing was actually
  // retrieved — the disclaimer is a fixed response, not something grounded in KB content.
  let context = "";
  let sourceIds = [];
  let aiResponse;

  if (await isUnsafeQuestion(question)) {
    aiResponse = SAFETY_DISCLAIMER;
  } else {
    ({ context, sourceIds } = await retrieveContext(question));
    aiResponse = await generateReply(question, context, turnNumber);
  }

  const turn = await AIConversation.create({
    userId: req.user._id,
    question,
    retrievedContext: context,
    aiResponse,
    sourceIds,
  });

  // Was already saved to the DB before this (see sourceIds above) but never sent back
  // to whoever asked — meaning no client could ever actually show "this answer is
  // based on WHO/CDC" even though the data existed. Populated here (not just returning
  // raw ObjectIds) so the response carries the actual citation name/URL directly.
  await turn.populate("sourceIds");

  if (!req.user.onboarding.firstQuestionAsked) {
    req.user.onboarding.firstQuestionAsked = true;
    await req.user.save();
  }

  return success(
    res,
    {
      turnId: turn._id,
      question: turn.question,
      aiResponse: turn.aiResponse,
      sources: turn.sourceIds.map((s) => ({
        sourceId: s._id,
        sourceName: s.sourceName,
        sourceUrl: s.sourceUrl,
      })),
      createdAt: turn.createdAt,
    },
    201
  );
});

const getConversation = asyncHandler(async (req, res) => {
  const turns = await AIConversation.find({ userId: req.user._id })
    .sort({ createdAt: 1 })
    .select("question aiResponse createdAt");

  return success(res, turns);
});

// Note: this does NOT reset onboarding.firstQuestionAsked — that flag tracks whether
// the Getting-Started checklist item has ever been completed, not whether history is
// currently empty, so clearing history shouldn't make it reappear as an unfinished step.
const clearConversation = asyncHandler(async (req, res) => {
  await AIConversation.deleteMany({ userId: req.user._id });
  return successMessage(res, "Conversation history cleared.");
});

module.exports = { ask, getConversation, clearConversation };
