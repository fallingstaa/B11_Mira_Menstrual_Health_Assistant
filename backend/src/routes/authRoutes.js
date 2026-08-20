const express = require("express");

const { register, login, forgotPassword } = require("../controllers/authController");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema, forgotPasswordSchema } = require("../validators/authValidators");
const { authLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

// Tighter rate limit than the rest of the API — see rateLimiters.js for why these
// three routes specifically are worth throttling harder.
router.use(authLimiter);

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Verifies the Firebase ID token from a just-created Firebase account and creates the matching Mongo `User` document. Call this immediately after `createUserWithEmailAndPassword` on the client.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken, name]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Fresh Firebase ID token for the account just created client-side.
 *               name:
 *                 type: string
 *                 example: Amara
 *               age:
 *                 type: integer
 *                 minimum: 9
 *                 maximum: 100
 *                 description: Optional. Collected on register.tsx's own form (not deferred to period-setup).
 *     responses:
 *       201:
 *         description: User created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/RegisterResponse' }
 *       400:
 *         description: idToken or name missing.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       409:
 *         description: A User document already exists for this Firebase account.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.post("/register", validate(registerSchema), register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sync session / login
 *     description: Verifies a Firebase ID token and returns the user's onboarding status. If Firebase has an account but Mongo has no matching `User` doc (a dropped registration), one is created automatically instead of erroring.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login synced.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { $ref: '#/components/schemas/LoginResponse' }
 *       400:
 *         description: idToken missing.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.post("/login", validate(loginSchema), login);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset
 *     description: >
 *       Generates a Firebase password-reset link. **TODO:** nothing currently delivers this link by email — see
 *       the `TODO` in authController.js. Deliberately returns the same success message whether or not the email
 *       has an account, to avoid user-enumeration.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Always returned, regardless of whether the account exists.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/MessageResponse' } } }
 *       400:
 *         description: email missing.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

module.exports = router;
