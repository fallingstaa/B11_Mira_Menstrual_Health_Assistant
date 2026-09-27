/**
 * Replaces Firebase with a fake for integration tests — require this FIRST in a test file,
 * before anything that loads authMiddleware/testApp, so the mocks are registered in time.
 *
 * - config/firebase is stubbed so nothing needs real credentials or initializes the Admin SDK.
 * - firebase-admin/auth's verifyIdToken is replaced by a tiny fake that understands tokens of
 *   the form "test-token:<firebaseUid>" (build one with tokenFor() in testHelpers.js).
 *   Anything else is rejected, which authMiddleware turns into its normal 401.
 *
 * Only Firebase is faked. authMiddleware itself, its User.findOne lookup, and everything after
 * it are the real code.
 */
jest.mock("../../../../config/firebase", () => ({}));

jest.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    verifyIdToken: async (token) => {
      const match = /^test-token:(.+)$/.exec(token);
      if (!match) throw new Error("Invalid token (mock)");
      return { uid: match[1], email_verified: true };
    },
  }),
}));
