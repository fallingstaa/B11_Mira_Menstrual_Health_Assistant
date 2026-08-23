/**
 * Prints a fresh Firebase ID token for a standing dev test account — paste it into
 * Swagger UI's "Authorize" dialog (http://localhost:5000/api/docs) to try out any
 * endpoint that needs `Authorization: Bearer <token>`.
 *
 * Why this exists: Swagger can't run the Firebase *client* SDK itself (that's what
 * normally produces an ID token — see mobile-app/src/context/auth-context.tsx), and
 * this backend never sees a password, only tokens it verifies. This script is the
 * missing piece: it talks to Firebase's Auth REST API directly with the same public
 * Web API key the mobile app uses, using one fixed throwaway account (TEST_USER_EMAIL/
 * TEST_USER_PASSWORD in .env) — signing in if it already exists, signing up the first
 * time. Tokens expire after 1 hour, so just re-run this whenever Swagger starts
 * returning 401s.
 *
 * Usage:  npm run token   (from backend/)
 */
// `quiet: true` matters here specifically: dotenv's own startup banner prints to
// *stdout*, not stderr — left on, it'd get mixed into the token this script prints on
// stdout (the whole point of piping `npm run token | clip` is that stdout is *only*
// the token).
require("dotenv").config({ quiet: true });

// Admin SDK, not the public Identity Toolkit REST API this script otherwise talks to —
// only the Admin SDK can flip emailVerified directly, no inbox click needed. Since
// authMiddleware.js now rejects unverified tokens (see its "EMAIL_NOT_VERIFIED" check),
// without this the dev test account would need a real verification-link click before
// Swagger could use it for anything past /auth/login.
const { getAuth } = require("firebase-admin/auth");
const firebaseApp = require("../config/firebase");

const API_KEY = process.env.TEST_FIREBASE_WEB_API_KEY;
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

if (!API_KEY || !EMAIL || !PASSWORD) {
  console.error(
    "Missing TEST_FIREBASE_WEB_API_KEY / TEST_USER_EMAIL / TEST_USER_PASSWORD in backend/.env.\n" +
      "TEST_FIREBASE_WEB_API_KEY is the same value as EXPO_PUBLIC_FIREBASE_API_KEY in mobile-app/.env — not a secret, just copy it over."
  );
  process.exit(1);
}

async function callIdentityToolkit(endpoint) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `${endpoint} failed (${res.status})`);
  return json;
}

(async () => {
  let result;
  try {
    // The common case: the dev test account already exists from a previous run.
    result = await callIdentityToolkit("signInWithPassword");
    console.error(`[get-test-token] signed in as ${EMAIL}`);
  } catch (err) {
    // Firebase returns EMAIL_NOT_FOUND on older projects, or the more generic
    // INVALID_LOGIN_CREDENTIALS on newer ones (it deliberately stopped distinguishing
    // "no such account" from "wrong password" to avoid leaking which emails exist).
    // Either way, our own dev account genuinely doesn't exist yet on a first run.
    if (err.message !== "EMAIL_NOT_FOUND" && err.message !== "INVALID_LOGIN_CREDENTIALS") throw err;
    // First run — create it. It'll exist in your Firebase project's Authentication
    // tab from now on; sign in silently succeeds on every later run.
    result = await callIdentityToolkit("signUp");
    console.error(`[get-test-token] created new dev test account ${EMAIL}`);
  }

  // Force-verify the throwaway dev account (see the require() comment above) — this
  // doesn't touch the ID token we already have in `result`, so it's re-fetched fresh
  // afterward to make sure the returned token actually reflects email_verified: true.
  await getAuth(firebaseApp).updateUser(result.localId, { emailVerified: true });
  result = await callIdentityToolkit("signInWithPassword");

  console.error(`[get-test-token] uid: ${result.localId}  (expires in ${result.expiresIn}s)`);
  console.error("[get-test-token] paste the token below into Swagger's Authorize dialog:\n");
  // Only the token itself goes to stdout, so `npm run token | clip` (or `| pbcopy`)
  // copies just the token — everything else above is stderr/status noise.
  console.log(result.idToken);
})().catch((err) => {
  console.error("[get-test-token] failed:", err.message);
  process.exit(1);
});
