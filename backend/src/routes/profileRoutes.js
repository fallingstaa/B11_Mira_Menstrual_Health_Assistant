const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { getMe, updateMe, deleteMe } = require("../controllers/profileController");
const validate = require("../middleware/validate");
const { updateProfileSchema } = require("../validators/profileValidators");

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

module.exports = router;
