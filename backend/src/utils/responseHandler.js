/** Standard success envelope: { status: "success", data }. */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ status: "success", data });
}

/** Standard success envelope for actions with nothing to return but a message. */
function successMessage(res, message, statusCode = 200) {
  return res.status(statusCode).json({ status: "success", message });
}

/** Standard error envelope: { status: "error", message }. */
function error(res, message, statusCode = 400) {
  return res.status(statusCode).json({ status: "error", message });
}

module.exports = { success, successMessage, error };
