const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { getPrediction, listRecords, upsertRecord, deleteRecord } = require("../controllers/menstrualController");
const validate = require("../middleware/validate");
const { upsertRecordSchema } = require("../validators/menstrualValidators");

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/menstrual/prediction:
 *   get:
 *     tags: [Menstrual Tracking]
 *     summary: Get cycle prediction
 *     description: >
 *       Computes the current cycle day/phase and next-period window from `User.cycle` — a cache recomputed by
 *       `cycleCacheService.js` after every `POST`/`DELETE` on `/api/menstrual/records` (grouped from actual
 *       logged period days, not manually set).
 *     parameters:
 *       - in: query
 *         name: asOf
 *         schema: { type: string, format: date }
 *         description: >
 *           **Dev/test only** (ignored when `NODE_ENV=production` — real users can never affect their own
 *           results with this). Simulates a different "today" for `currentDay`/`phase` only — the predicted
 *           dates themselves never depend on `asOf`, only on `lastPeriodStart` + the cached averages. Lets you
 *           check "what day/phase would this show on date X" without waiting for the real calendar to get there.
 *     responses:
 *       200:
 *         description: Prediction based on the user's cached cycle stats. Date fields are null if no period has ever been recorded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/PredictionResponse' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/prediction", getPrediction);

/**
 * @openapi
 * /api/menstrual/records:
 *   get:
 *     tags: [Menstrual Tracking]
 *     summary: List menstrual records
 *     description: Retrieves the signed-in user's logged days, optionally bounded by date range, sorted ascending by date.
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Inclusive lower bound (YYYY-MM-DD).
 *         example: "2026-07-01"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: Inclusive upper bound (YYYY-MM-DD).
 *         example: "2026-08-31"
 *     responses:
 *       200:
 *         description: Matching records.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/MenstrualRecord' }
 *       400:
 *         description: from/to is present but not a valid date.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/records", listRecords);

/**
 * @openapi
 * /api/menstrual/records:
 *   post:
 *     tags: [Menstrual Tracking]
 *     summary: Create or update a day's record
 *     description: >
 *       Upserts by (user, date) — a second call for the same date overwrites it rather than creating a duplicate.
 *       Setting `isPeriodEnd: true` automatically un-sets it on every other record for this user first, so at most
 *       one day is ever flagged as the period's end. Also triggers a recompute of the user's cached cycle stats
 *       (`User.cycle` — see `GET /api/menstrual/prediction`) from their updated record history.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenstrualRecordUpsertRequest'
 *     responses:
 *       201:
 *         description: The created/updated record.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/MenstrualRecord' }
 *       400:
 *         description: Missing `date`/`source`, or an invalid `source`/`status` value.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/records", validate(upsertRecordSchema), upsertRecord);

/**
 * @openapi
 * /api/menstrual/records/{date}:
 *   delete:
 *     tags: [Menstrual Tracking]
 *     summary: Delete a day's record
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *         example: "2026-08-10"
 *     responses:
 *       200:
 *         description: Deleted (or was already absent — this endpoint does not 404 on a missing record today).
 *         content: { application/json: { schema: { $ref: '#/components/schemas/MessageResponse' } } }
 *       400:
 *         description: date is not a valid date.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/records/:date", deleteRecord);

module.exports = router;
