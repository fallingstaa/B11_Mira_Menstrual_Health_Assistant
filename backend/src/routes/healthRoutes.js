const express = require("express");

const router = express.Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Public liveness check — confirms the API process is up. Does not verify Mongo/Firebase connectivity.
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/health", (req, res) => {
    res.json({
        status: "success",
        message: "Mira API is healthy",
        timestamp: new Date()
    });
});

module.exports = router;