import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// getReactNativePersistence only exists in @firebase/auth's "react-native"-conditioned
// build (dist/rn/index.rn.d.ts) — Metro resolves that at bundle time (Expo's metro
// config enables the "react-native" export condition), but tsc's static check doesn't
// follow the same conditional-exports branch here even with customConditions set in
// tsconfig, so this import type-errors despite being valid at runtime. Known upstream
// friction between the Firebase JS SDK's package layout and tsc's exports resolution —
// remove the suppression if a future Firebase/TS release fixes it (ts-expect-error
// will itself fail once it's no longer needed).
// @ts-expect-error — see comment above; resolves fine at runtime via Metro.
import { getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Client-side Firebase config — this is NOT the same secret as the backend's
 * FIREBASE_PRIVATE_KEY (Admin SDK service account credentials, server-only). This
 * apiKey/appId set is meant to ship inside the app bundle; Firebase's actual security
 * boundary is the backend verifying ID tokens (see authMiddleware.js), not hiding
 * these values. Get them from Firebase Console → Project Settings → General → Your
 * apps → Web app.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth() throws if it's ever called a second time on the same app (e.g. on
// a Fast Refresh during development) — fall back to the already-initialized instance
// instead of crashing the dev server.
export const auth = (() => {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
})();

export default app;
