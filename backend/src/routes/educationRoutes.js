const express = require("express");

const { listArticles, getArticleById } = require("../controllers/educationController");

const router = express.Router();

// Public/shared content — no auth required (Security Design 14.2: EducationalContent
// is a shared read collection, not owned by any single user).

/**
 * @openapi
 * /api/education/articles:
 *   get:
 *     tags: [Education]
 *     summary: List educational articles
 *     description: >
 *       Public — no Authorization header needed. **Known gap:** the `EducationalContent` collection has no seed
 *       data yet, so this returns an empty array until content is manually populated (see backend to-do list).
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, example: Hygiene }
 *         description: Filter by exact category match.
 *     responses:
 *       200:
 *         description: Matching articles (title + category only — use the detail endpoint for full body).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/EducationalArticleSummary' }
 */
router.get("/articles", listArticles);

/**
 * @openapi
 * /api/education/articles/{id}:
 *   get:
 *     tags: [Education]
 *     summary: Get full article content
 *     description: Public — no Authorization header needed.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The article's Mongo `_id`.
 *     responses:
 *       200:
 *         description: Full article.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/EducationalArticleDetail' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/articles/:id", getArticleById);

module.exports = router;
