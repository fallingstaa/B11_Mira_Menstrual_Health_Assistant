const { initializeApp, cert } = require("firebase-admin/app");

/**
 * Credential source, checked in this order:
 *
 * 1. FIREBASE_SERVICE_ACCOUNT_BASE64 — the whole service account JSON key,
 *    base64-encoded into one line. Preferred on hosts like Render: pasting a
 *    multi-line PEM private key into a dashboard's env var box is fragile in
 *    practice (wrapping quotes get captured literally, CRLF vs LF line endings
 *    get mangled, trailing whitespace sneaks in) and silently produces the
 *    "Failed to parse private key" / OpenSSL DECODER "unsupported" error at
 *    boot. Base64 has no embedded newlines or quotes for a web form to mangle.
 *
 * 2. FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY — the
 *    original three-var form, kept for local dev since it's what's already in
 *    .env / .env.example. The private key here still needs literal "\n"
 *    sequences converted back to real newlines (real newlines aren't valid in
 *    a single-line env value).
 */
function resolveCredential() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
        return cert(JSON.parse(json));
    }

    return cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    });
}

const firebaseApp = initializeApp({
    credential: resolveCredential(),
    // Same bucket the mobile client's Firebase config already points at
    // (EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET in mobile-app/.env) — not a secret, just an
    // identifier, so it's fine for both the Admin SDK here and the client SDK there to
    // reference the same one. Only needed for firebase-admin/storage (profile avatar
    // uploads); every other Admin SDK usage in this backend (Auth) ignores it.
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

module.exports = firebaseApp;
