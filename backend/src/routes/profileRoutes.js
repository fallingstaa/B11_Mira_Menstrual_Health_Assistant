const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { getMe, updateMe, deleteMe, savePushToken, changeEmail, uploadAvatar, getAvatar, deleteAvatar, exportData } = require("../controllers/profileController");
const validate = require("../middleware/validate");
const uploadAvatarPhoto = require("../middleware/uploadAvatar");
const { updateProfileSchema, pushTokenSchema, changeEmailSchema } = require("../validators/profileValidators");

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
 * /api/profile/email:
 *   put:
 *     tags: [Profile]
 *     summary: Change the signed-in user's login email
 *     description: >
 *       A separate endpoint from `PUT /api/profile/me` — changing email touches Firebase Auth (the actual login
 *       identity), not just this Mongo profile doc, so it needs its own validation/error handling. Takes effect
 *       immediately; there's no verification-link step yet (same gap as `POST /api/auth/forgot-password` — Firebase
 *       generates links, nothing sends them).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: "new-address@example.com" }
 *     responses:
 *       200:
 *         description: Email changed (or unchanged, if it matched the current one already).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: string }
 *                     email: { type: string, format: email }
 *       400:
 *         description: email missing/not a valid address.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: That email is already in use by another account (Mongo or Firebase).
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.put("/email", validate(changeEmailSchema), changeEmail);

/**
 * @openapi
 * /api/profile/avatar:
 *   post:
 *     tags: [Profile]
 *     summary: Upload/replace the signed-in user's profile photo
 *     description: >
 *       Stores the photo in MongoDB (Avatar collection) and points `profile.avatarUrl` at this same API's own
 *       `GET /api/profile/avatar`, which serves the image only to its owner. A new upload overwrites the previous
 *       photo in place — there's only ever one avatar per user, no history.
 *       Max 5MB, JPEG/PNG/WebP only.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [photo]
 *             properties:
 *               photo: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Uploaded. `avatarUrl` is now this API's own avatar endpoint.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl: { type: string, format: uri }
 *       400:
 *         description: No `photo` field sent, wrong file type, or over the 5MB cap.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/avatar", uploadAvatarPhoto, uploadAvatar);

/**
 * @openapi
 * /api/profile/avatar:
 *   get:
 *     tags: [Profile]
 *     summary: Get the signed-in user's profile photo
 *     description: Streams the raw image bytes (whatever Content-Type it was uploaded as) — this is what `profile.avatarUrl` points at, meant to be loaded directly (e.g. as an `<Image>` source), not JSON.
 *     responses:
 *       200:
 *         description: The image.
 *         content:
 *           image/jpeg: { schema: { type: string, format: binary } }
 *           image/png: { schema: { type: string, format: binary } }
 *           image/webp: { schema: { type: string, format: binary } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No avatar has been uploaded yet.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get("/avatar", getAvatar);

/**
 * @openapi
 * /api/profile/avatar:
 *   delete:
 *     tags: [Profile]
 *     summary: Remove the signed-in user's profile photo
 *     description: Deletes the Storage object and clears `profile.avatarUrl` together, so the two can't drift out of sync.
 *     responses:
 *       200:
 *         description: Removed (or there was nothing to remove — this endpoint does not 404 on an already-clear avatar).
 *         content: { application/json: { schema: { $ref: '#/components/schemas/MessageResponse' } } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/avatar", deleteAvatar);

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
