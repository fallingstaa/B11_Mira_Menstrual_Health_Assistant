const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { ask, getConversation, clearConversation } = require("../controllers/aiController");

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/ai/ask:
 *   post:
 *     tags: [AI Assistant]
 *     summary: Ask Yumi a health question
 *     description: >
 *       Safety-checks the question (blocked diagnosis/medication questions get a fixed disclaimer), searches the
 *       English knowledge base, and writes an answer grounded only in what was found, with its sources. Khmer
 *       questions are translated to English for the search inside the same safety-check call, and the answer is
 *       written in the request's `language` (a Khmer-script question is always answered in Khmer).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AskRequest'
 *     responses:
 *       201:
 *         description: The saved turn (placeholder AI reply until Gemini is wired in).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/AskResponse' }
 *       400:
 *         description: question missing/empty.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/ask", ask);

/**
 * @openapi
 * /api/ai/conversation:
 *   get:
 *     tags: [AI Assistant]
 *     summary: Get conversation history
 *     description: All past turns for the signed-in user, oldest first.
 *     responses:
 *       200:
 *         description: Conversation turns.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ConversationTurn' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/conversation", getConversation);

/**
 * @openapi
 * /api/ai/conversation:
 *   delete:
 *     tags: [AI Assistant]
 *     summary: Clear conversation history
 *     description: >
 *       Permanently deletes every past Q&A turn for the signed-in user. Cannot be undone. Does not affect
 *       `onboarding.firstQuestionAsked` — that flag tracks whether the Getting-Started checklist item was ever
 *       completed, not whether history is currently empty.
 *     responses:
 *       200:
 *         description: History cleared.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/MessageResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/conversation", clearConversation);

module.exports = router;
