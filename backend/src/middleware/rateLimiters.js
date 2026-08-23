const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = rateLimit;

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

/**
 * Second, independent limiter on top of authLimiter — keyed by the *target email*
 * instead of the caller's IP. authLimiter alone can't stop someone rotating across
 * many IPs/VPNs from repeatedly hitting generatePasswordResetLink for one specific
 * victim's address (inbox-spamming them with reset emails, or probing timing/behavior
 * per address) — every one of those requests looks like a totally different, unrelated
 * caller to an IP-keyed limiter. This one recognizes it as the same target regardless
 * of where it's coming from.
 *
 * Note on why login/register don't get an equivalent: this backend never sees a
 * password or a failed sign-in attempt at all — the mobile app authenticates directly
 * against Firebase (see auth-context.tsx), and Firebase itself already throttles
 * repeated failed password attempts per-account (surfaced to the client as
 * `auth/too-many-requests` — see login.tsx's error mapping). There's no equivalent
 * "guessable secret" on register/login for a per-account limiter here to protect.
 */
const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Falls back to IP only if `email` is somehow missing at this point (e.g. a
  // malformed request that validate(forgotPasswordSchema) will reject moments later
  // anyway) — keyGenerator must always return *something*, and there's no target
  // email yet to key on in that case. ipKeyGenerator (not the raw string) normalizes
  // IPv6 addresses first — the same address can be written multiple equivalent ways,
  // and comparing raw strings would let that be used to dodge this limiter entirely.
  keyGenerator: (req) => req.body?.email?.trim().toLowerCase() || ipKeyGenerator(req.ip),
  handler: limitResponse("Too many reset requests for this email — please try again later."),
});

module.exports = { apiLimiter, authLimiter, forgotPasswordEmailLimiter };
