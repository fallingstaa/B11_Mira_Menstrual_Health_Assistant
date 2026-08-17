const rateLimit = require("express-rate-limit");

const { error } = require("../utils/responseHandler");

// Same {status:"error", message} shape as every other error response — a rate-limited
// request shouldn't look different from any other 400/401 to a client.
function limitResponse(message) {
  return (req, res) => error(res, message, 429);
}

/**
 * Generous, whole-API floor against runaway loops/scripts — high enough that normal
 * app usage (even a chatty screen re-fetching on focus) never comes close to it.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitResponse("Too many requests — please slow down and try again shortly."),
});

/**
 * Tighter limit specifically on auth (register/login/forgot-password) — these are the
 * routes worth throttling harder: credential-stuffing against /login, account-creation
 * spam against /register, and email-enumeration attempts against /forgot-password
 * (which already returns an identical message either way — see authController.js —
 * this adds a second, independent layer against the same risk).
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitResponse("Too many attempts — please try again in a few minutes."),
});

module.exports = { apiLimiter, authLimiter };
