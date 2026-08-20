const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { getMe, updateMe, deleteMe, savePushToken, exportData } = require("../controllers/profileController");
const validate = require("../middleware/validate");
const { updateProfileSchema, pushTokenSchema } = require("../validators/profileValidators");

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/profile/me:
 *   get:
 *     tags: [Profile]
 *     summary: Get the signed-in user's profile
 *     responses:
 *       200:
 *         description: Profile, preferences, and cached cycle stats.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/Profile' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/me", getMe);

/**
 * @openapi
 * /api/profile/me:
 *   put:
 *     tags: [Profile]
 *     summary: Update the signed-in user's profile
 *     description: All fields optional — only provided keys are updated. `preferences` is merged key-by-key, not replaced wholesale.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Updated profile fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/ProfileUpdateResponse' }
 *       400:
 *         description: A provided field failed validation (e.g. dateOfBirth not in YYYY-MM-DD format).
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/me", validate(updateProfileSchema), updateMe);

/**
 * @openapi
 * /api/profile/me:
 *   delete:
 *     tags: [Profile]
 *     summary: Delete account & all personal data
 *     description: >
 *       Irreversible. Erases every `MenstrualRecord`, `AIConversation`, and `NotificationReminder` document owned
 *       by this user, deletes the Mongo `User` doc, then deletes the Firebase account itself — in that order (see
 *       profileController.js for why). The Firebase ID token used to authorize this call is invalidated the
 *       moment the Firebase account is deleted, so there's nothing further the client needs to clean up beyond
 *       signing out locally.
 *     responses:
 *       200:
 *         description: Account and all associated personal data permanently deleted.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/MessageResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/me", deleteMe);

/**
 * @openapi
 * /api/profile/push-token:
 *   post:
 *     tags: [Profile]
 *     summary: Save/update this device's Expo push token
 *     description: >
 *       Storage only — there's no FCM/Expo push *delivery* wired up yet (see the Reminders endpoints' description
 *       for that gap). Always overwrites any previously saved token, since a device only ever has one current one.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expoPushToken]
 *             properties:
 *               expoPushToken: { type: string, example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
 *     responses:
 *       200:
 *         description: Saved.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/MessageResponse' } } }
 *       400:
 *         description: expoPushToken missing or not in the expected Expo format.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/push-token", validate(pushTokenSchema), savePushToken);

/**
 * @openapi
 * /api/profile/export:
 *   get:
 *     tags: [Profile]
 *     summary: Export all personal data as a downloadable JSON file
 *     description: >
 *       Profile fields (name/age/DOB/language/preferences/onboarding/cycle cache) plus every logged
 *       `MenstrualRecord`, sorted ascending by date. Sent with `Content-Disposition: attachment` so a browser or
 *       Postman saves it as a file instead of rendering it inline. Does not include AI conversation history or
 *       reminders — see `DELETE /api/profile/me` for full account deletion, which does erase those too.
 *     responses:
 *       200:
 *         description: The export payload.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     exportedAt: { type: string, format: date-time }
 *                     profile: { type: object }
 *                     menstrualRecords:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/MenstrualRecord' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/export", exportData);

module.exports = router;
