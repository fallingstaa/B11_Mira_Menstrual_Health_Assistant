const { getAuth } = require("firebase-admin/auth");

const firebaseApp = require("../../config/firebase");
const User = require("../models/User");
const { success, successMessage, error } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

/**
 * The client SDK does the actual sign-up/sign-in against Firebase; these endpoints
 * only ever see the resulting ID token, verify it, and sync our own User document.
 * The backend never sees a password.
 */
async function verifyToken(idToken) {
  return getAuth(firebaseApp).verifyIdToken(idToken);
}

const register = asyncHandler(async (req, res) => {
  const { idToken, name } = req.body;
  if (!idToken || !name) {
    return error(res, "idToken and name are required", 400);
  }

  const decoded = await verifyToken(idToken);

  const existing = await User.findOne({ firebaseUid: decoded.uid });
  if (existing) {
    return error(res, "An account already exists for this token", 409);
  }

  const user = await User.create({
    firebaseUid: decoded.uid,
    email: decoded.email,
    profile: { name },
  });

  return success(
    res,
    {
      userId: user._id,
      name: user.profile.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return error(res, "idToken is required", 400);

  const decoded = await verifyToken(idToken);
  let user = await User.findOne({ firebaseUid: decoded.uid });

  if (!user) {
    // Self-heal a partial registration: Firebase created the account, but the
    // matching /auth/register call never completed (dropped connection, app closed
    // mid-request, wrong API URL, etc.). We already have a verified UID + email from
    // the token, so there's no reason to force the user through "create account" —
    // Firebase would just reject re-registering the same email anyway.
    console.warn(`[auth] login: no User doc for firebaseUid ${decoded.uid} — self-healing by creating one`);
    user = await User.create({
      firebaseUid: decoded.uid,
      email: decoded.email,
      // decoded.name is only present if the Firebase account has a displayName set,
      // which our own register flow doesn't set — falls back to the email's local
      // part so the field is never blank; user can correct it via PUT /profile/me.
      profile: { name: decoded.name || decoded.email?.split("@")[0] || "Mira User" },
    });
  }

  return success(res, {
    userId: user._id,
    name: user.profile.name,
    email: user.email,
    onboarding: user.onboarding,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return error(res, "email is required", 400);

  try {
    // TODO: actually deliver this link via an email service (SendGrid/Nodemailer) —
    // Firebase only generates it, it doesn't send it.
    await getAuth(firebaseApp).generatePasswordResetLink(email);
  } catch (err) {
    // Deliberately swallow "user not found" so this endpoint can't be used to
    // discover which emails have an account (user-enumeration protection, per
    // Security Design 14.6).
    if (err.code !== "auth/user-not-found") throw err;
  }

  return successMessage(res, "If an account exists for that email, a reset link has been sent.");
});

module.exports = { register, login, forgotPassword };
