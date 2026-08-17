const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { ask, getConversation } = require("../controllers/aiController");

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/ai/ask:
 *   post:
 *     tags: [AI Assistant]
 *     summary: Ask Mira a health question
 *     description: >
 *       Creates an `AIConversation` turn end-to-end today, but `ragService.js` and `geminiService.js` are still
 *       placeholders — `retrieveContext()` always returns empty context and `generateReply()` always returns a
 *       canned string, regardless of the question. Real Gemini/RAG wiring is on the backend to-do list.
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

module.exports = router;
