/**
 * CORS only matters to *browser* clients — a browser is the only kind of client that
 * sends an `Origin` header and enforces same-origin restrictions on the response; the
 * React Native mobile app's `fetch` never sends one, so nothing here ever affects it,
 * in dev or production. What this actually gates is: "which websites' JavaScript is
 * allowed to read responses from this API" — e.g. someone else's webpage trying to
 * call the API from a visitor's browser using their session.
 *
 * Dev: stays wide open (the old `cors()` behavior) — the Expo web dev server's origin
 * varies by machine/port, so pinning it here would just mean constantly updating an
 * env var to match whatever port Expo picked today.
 *
 * Production: only origins explicitly listed in ALLOWED_ORIGINS (comma-separated) are
 * allowed; everything else is rejected. Sets a hard boundary before this ever needs to
 * actually serve real traffic — see Security Design 14.4, which flagged the old
 * wide-open `cors()` call as needing this before any real deployment.
 */
function buildCorsOptions() {
  if (process.env.NODE_ENV !== "production") {
    return {};
  }

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      // No Origin header at all — a native app, curl, server-to-server call, or the
      // Swagger/test-ui pages themselves (same-origin requests don't send it either).
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin "${origin}" is not allowed by CORS`));
    },
  };
}

module.exports = buildCorsOptions;
