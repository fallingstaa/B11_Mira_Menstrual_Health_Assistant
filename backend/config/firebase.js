const { initializeApp, cert } = require("firebase-admin/app");

// .env stores the private key with literal "\n" sequences (real newlines
// aren't valid in a single-line env value), so they need to be converted
// back to actual newlines before Firebase will accept the key.
const firebaseApp = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    // Same bucket the mobile client's Firebase config already points at
    // (EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET in mobile-app/.env) — not a secret, just an
    // identifier, so it's fine for both the Admin SDK here and the client SDK there to
    // reference the same one. Only needed for firebase-admin/storage (profile avatar
    // uploads); every other Admin SDK usage in this backend (Auth) ignores it.
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

module.exports = firebaseApp;
