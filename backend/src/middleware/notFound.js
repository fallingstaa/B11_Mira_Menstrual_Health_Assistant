const { error } = require("../utils/responseHandler");

/** Catches any request that didn't match a mounted route. Registered just before errorHandler. */
function notFound(req, res) {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

module.exports = notFound;
