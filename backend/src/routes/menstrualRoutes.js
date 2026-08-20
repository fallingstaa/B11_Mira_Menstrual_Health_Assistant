const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { getPrediction, listRecords, upsertRecord, deleteRecord, updateCycleSetup, batchUpsertRecords } = require("../controllers/menstrualController");
const validate = require("../middleware/validate");
const { upsertRecordSchema, cycleSetupSchema, batchUpsertRecordSchema } = require("../validators/menstrualValidators");

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
 * /api/menstrual/records/batch:
 *   post:
 *     tags: [Menstrual Tracking]
 *     summary: Log multiple days in one call
 *     description: >
 *       Upserts every entry in `records` inside a single Mongo transaction — either all of them are saved or none
 *       are — then recomputes the cached cycle stats once at the end (see `GET /api/menstrual/prediction`), not
 *       once per entry. `source` applies to the whole batch, not repeated per entry. Requires a replica-set
 *       MongoDB deployment for transactions (MongoDB Atlas, used in this project, always qualifies).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [source, records]
 *             properties:
 *               source:
 *                 type: string
 *                 enum: [calendar, checkin, record, record_first_period, last_period_one_date]
 *               records:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 90
 *                 items:
 *                   type: object
 *                   required: [date]
 *                   properties:
 *                     date: { type: string, format: date, example: "2026-08-10" }
 *                     isPeriodDay: { type: boolean, default: true, description: "Defaults to true here, unlike the single-record POST /records (default false)." }
 *                     isPeriodEnd: { type: boolean, default: false }
 *                     status: { type: string, enum: [on, spotting, off] }
 *                     flow: { type: string, example: medium, description: "Stored as flowLevel on the saved record." }
 *                     symptoms: { type: array, items: { type: string } }
 *                     mood: { type: string, example: calm }
 *                     notes: { type: string }
 *     responses:
 *       201:
 *         description: The created/updated records, in the same order as the request.
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
 *         description: Missing `source`, empty/oversized `records`, or an invalid entry.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/records/batch", validate(batchUpsertRecordSchema), batchUpsertRecords);

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

/**
 * @openapi
 * /api/menstrual/cycle-setup:
 *   put:
 *     tags: [Menstrual Tracking]
 *     summary: Save onboarding's beginner flag / manual cycle & period length estimate
 *     description: >
 *       Server-side landing spot for the setup-flow answers that aren't a dated record: "I don't remember any
 *       dates" (`isBeginner`, Path C — see `last-period-unknown.tsx`) and "do you know your usual cycle/period
 *       length?" (`manualCycleLength`/`manualPeriodLength`, asked on Paths A and B — see
 *       `cycle-length-question.tsx`). Partial update — only provided keys change — but at least one must be
 *       present. The manual length fields only ever affect `cycle.averageCycleLength`/`averagePeriodLength`
 *       while there's fewer than 2 fully-logged periods to compute a real average from; once real history
 *       exists it silently takes over, exactly like the client-side logic in `context/app-state.tsx`. Triggers
 *       the same cache recompute as `POST`/`DELETE` on `/api/menstrual/records`, so the response's `cycle`
 *       reflects it immediately.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isBeginner: { type: boolean }
 *               manualCycleLength: { type: integer, minimum: 21, maximum: 45, example: 28 }
 *               manualPeriodLength: { type: integer, minimum: 1, maximum: 14, example: 5 }
 *     responses:
 *       200:
 *         description: Saved. Includes the recomputed cycle cache.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     isBeginner: { type: boolean }
 *                     manualCycleLength: { type: integer, nullable: true }
 *                     manualPeriodLength: { type: integer, nullable: true }
 *                     cycle: { $ref: '#/components/schemas/CycleCache' }
 *       400:
 *         description: No fields provided, or a provided field is out of range.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/cycle-setup", validate(cycleSetupSchema), updateCycleSetup);

module.exports = router;
