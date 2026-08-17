const { error } = require("../utils/responseHandler");

/**
 * Route-level request validation, backed by a Zod schema — replaces the old pattern of
 * hand-rolled `if (!field) return error(...)` / enum-membership checks scattered
 * across each controller (see e.g. the old upsertRecord/authController). One schema
 * per route, declared next to that route, checked *before* the controller runs — so
 * every 400 in the API follows the exact same `{status:"error", message}` shape
 * without each controller re-implementing that formatting by hand.
 *
 * On success, `req.body` is replaced with the *parsed* value — schemas can therefore
 * also trim strings, apply defaults, or coerce types, and the controller downstream
 * can trust the shape it receives instead of re-checking it.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.length ? issue.path.join(".") : "body"}: ${issue.message}`)
        .join("; ");
      return error(res, message, 400);
    }

    req.body = result.data;
    next();
  };
}

module.exports = validate;
