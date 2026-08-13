/**
 * Wraps an async route handler so a rejected promise reaches errorHandler.js via
 * next(err) instead of crashing the request. Express 5 already forwards async
 * rejections automatically, but wrapping explicitly keeps every controller consistent
 * and makes the error-forwarding intent obvious to read.
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
