const { getAuth } = require("firebase-admin/auth");

const firebaseApp = require("../../config/firebase");
const User = require("../models/User");
const { error } = require("../utils/responseHandler");

/**
 * Verifies the Firebase ID token on the Authorization header and resolves it to our
 * own Mongo User document, attaching it as req.user. Every user-scoped controller
 * reads req.user._id instead of trusting any userId a client might send — see
 * Security Design 14.2 (Authorization & Data Ownership).
 */
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return error(res, "Missing or invalid Authorization header", 401);
  }

  try {
    const decoded = await getAuth(firebaseApp).verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      return error(res, "No account found for this token — register first", 404);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, "Invalid or expired token", 401);
  }
}

module.exports = authMiddleware;
