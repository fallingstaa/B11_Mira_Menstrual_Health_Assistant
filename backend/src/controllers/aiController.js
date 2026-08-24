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

const ask = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) return error(res, "question is required", 400);

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
    aiResponse = await generateReply(question, context);
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
