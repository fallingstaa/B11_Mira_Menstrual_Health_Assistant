/**
 * Dev/test-only escape hatch for anything that reads the real clock (cycle-day math,
 * "is the period starting soon" reminder windows, etc.) — lets a request simulate a
 * different "today" via `?asOf=YYYY-MM-DD` so that logic can be exercised immediately
 * instead of actually waiting real days for it to become true.
 *
 * Deliberately ignored outside development: production requests always get the real
 * current time no matter what's sent, so this can never be used to spoof a real user's
 * view of their own data once deployed — it's purely a way to test the *logic*.
 */
function resolveAsOf(req) {
  if (process.env.NODE_ENV === "production") return new Date();

  const raw = req.query?.asOf;
  if (!raw) return new Date();

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

module.exports = { resolveAsOf };
