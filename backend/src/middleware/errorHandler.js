const { error } = require("../utils/responseHandler");

/**
 * Catches anything forwarded to next(err) — including rejected promises from
 * asyncHandler-wrapped controllers — and turns it into the standard error envelope
 * instead of Express's default HTML stack-trace page. Must be registered last, after
 * every route, in server.js.
 */
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return error(res, err.message, 400);
  }
  if (err.code === 11000) {
    return error(res, "A record with that value already exists", 409);
  }

  return error(res, err.message || "Something went wrong", err.statusCode || 500);
}

module.exports = errorHandler;
