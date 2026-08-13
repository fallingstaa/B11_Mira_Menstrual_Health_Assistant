const AIConversation = require("../models/AIConversation");
const { success, error } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");
const { retrieveContext } = require("../services/ragService");
const { generateReply } = require("../services/geminiService");

const ask = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) return error(res, "question is required", 400);

  // Deliberately not sending req.user's name/email to the AI — only the question and
  // whatever the RAG layer retrieves (Security Design 14.5).
  const { context, sourceIds } = await retrieveContext(question);
  const aiResponse = await generateReply(question, context);

  const turn = await AIConversation.create({
    userId: req.user._id,
    question,
    retrievedContext: context,
    aiResponse,
    sourceIds,
  });

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

module.exports = { ask, getConversation };
