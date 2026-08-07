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
});

module.exports = firebaseApp;
