/** Standard success envelope: { status: "success", data }. */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ status: "success", data });
}

/** Standard success envelope for actions with nothing to return but a message. */
function successMessage(res, message, statusCode = 200) {
  return res.status(statusCode).json({ status: "success", message });
}

/**
 * Standard error envelope: { status: "error", message }. `code` is an optional
 * machine-readable tag (e.g. "EMAIL_NOT_VERIFIED") for the handful of error cases where
 * a client needs to branch on *which* error this is, not just show `message` as text —
 * matching on message strings would silently break the moment the wording changes.
 * Omitted entirely when not passed, so every existing error(res, message, statusCode)
 * call keeps producing the exact same body it always has.
 */
function error(res, message, statusCode = 400, code) {
  return res.status(statusCode).json({ status: "error", message, ...(code ? { code } : {}) });
}

module.exports = { success, successMessage, error };
