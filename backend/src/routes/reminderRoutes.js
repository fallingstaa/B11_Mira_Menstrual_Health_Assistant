const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { list, markRead, markAllRead } = require("../controllers/reminderController");

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/reminders:
 *   get:
 *     tags: [Reminders]
 *     summary: List reminders/notifications
 *     description: >
 *       Newest first. Before listing, lazily generates whatever reminders are newly due for this user —
 *       "period starting soon" (within 3 days of the cached prediction), a daily check-in nudge (if enabled and
 *       nothing's been logged today), and an unfinished-period nudge (if the last logged day was never flagged as
 *       the period's end and it's been at least a typical period length since). See `notificationService.js`.
 *       There's no push delivery (FCM) or cron scheduler yet — reminders only appear the next time this endpoint
 *       is called, not the instant they become true. "education"-type reminders aren't generated yet either —
 *       no `EducationalContent` is seeded to link them to.
 *     parameters:
 *       - in: query
 *         name: asOf
 *         schema: { type: string, format: date }
 *         description: >
 *           **Dev/test only** (ignored when `NODE_ENV=production`). Simulates a different "today" for the
 *           due-window checks above — e.g. set it to 2 days before a logged prediction's `nextPeriodStart` to see
 *           the "period starting soon" reminder generate immediately, instead of actually waiting 2 real days.
 *     responses:
 *       200:
 *         description: The user's reminders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/NotificationReminder' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", list);

/**
 * @openapi
 * /api/reminders/read-all:
 *   patch:
 *     tags: [Reminders]
 *     summary: Mark all reminders as read
 *     responses:
 *       200:
 *         description: Count of reminders updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string, example: All notifications marked as read. }
 *                 updatedCount: { type: integer, example: 3 }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/read-all", markAllRead);

/**
 * @openapi
 * /api/reminders/{id}/read:
 *   patch:
 *     tags: [Reminders]
 *     summary: Mark one reminder as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The reminder's Mongo `_id`.
 *     responses:
 *       200:
 *         description: The updated reminder.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/NotificationReminder' }
 *       400:
 *         description: id is not a validly-formatted Mongo ObjectId.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No reminder with that id belongs to the signed-in user.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.patch("/:id/read", markRead);

module.exports = router;
