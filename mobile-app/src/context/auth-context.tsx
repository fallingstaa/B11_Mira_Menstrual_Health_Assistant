import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';

import { auth } from '@/config/firebase';
import { apiRequest } from '@/utils/api';

type AuthContextValue = {
  user: FirebaseUser | null;
  /** True until Firebase has resolved whether a session is already persisted on-device — gate navigation on this, not on `user` alone, or a returning user will flash the login screen. */
  initializing: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Re-sends the verification link to the signed-in user's own address. */
  resendVerificationEmail: () => Promise<void>;
  /** Re-fetches the signed-in user from Firebase and reports whether their email is now verified — Firebase only knows this as of the last sign-in/reload, not live. */
  refreshEmailVerified: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Wraps Firebase's client auth so screens never talk to the Firebase SDK directly.
 * After every sign-up/sign-in, syncs with the backend (POST /api/auth/register or
 * /api/auth/login) so the Mongo User document exists — the ID token alone isn't
 * enough, the backend needs its own record to attach cycle data, chats, etc. to.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
  }, []);

  const register = async (name: string, email: string, password: string) => {
    console.log('[auth] register: creating Firebase user for', email);
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('[auth] ✗ Firebase createUserWithEmailAndPassword failed:', err);
      throw err;
    }
    console.log('[auth] ✓ Firebase user created, uid:', credential.user.uid);

    const idToken = await credential.user.getIdToken();
    try {
      await apiRequest('/auth/register', { method: 'POST', body: { idToken, name }, auth: false });
      console.log('[auth] ✓ backend register synced');
    } catch (err) {
      console.error('[auth] ✗ backend /auth/register failed after Firebase succeeded:', err);
      throw err;
    }

    // Best-effort — a failed send here shouldn't fail registration itself; the
    // verify-email screen has its own "resend" button for exactly this case.
    try {
      await sendEmailVerification(credential.user);
      console.log('[auth] ✓ verification email sent to', credential.user.email);
    } catch (err) {
      console.warn('[auth] ✗ sendEmailVerification failed (non-fatal, user can resend):', err);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[auth] login: signing in to Firebase for', email);
    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('[auth] ✗ Firebase signInWithEmailAndPassword failed:', err);
      throw err;
    }
    console.log('[auth] ✓ Firebase sign-in succeeded, uid:', credential.user.uid);

    const idToken = await credential.user.getIdToken();
    try {
      await apiRequest('/auth/login', { method: 'POST', body: { idToken }, auth: false });
      console.log('[auth] ✓ backend login synced');
    } catch (err) {
      console.error('[auth] ✗ backend /auth/login failed after Firebase succeeded:', err);
      throw err;
    }
  };

  const logout = () => signOut(auth);

  // Goes straight to Firebase rather than the backend's /api/auth/forgot-password —
  // sendPasswordResetEmail both generates *and delivers* the email in one call, so
  // there's no server round-trip needed for this particular flow.
  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('Not signed in');
    await sendEmailVerification(auth.currentUser);
  };

  // Firebase's own `user.emailVerified` is a snapshot from the last sign-in/reload —
  // it doesn't update itself just because the user clicked the link in another tab.
  // reload() re-fetches the account from Firebase so this reflects reality right now.
  const refreshEmailVerified = async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;

    // Critical: reload() only updates this *local* flag — it does NOT replace the
    // actual ID token every apiRequest() call sends as the Authorization header. That
    // token has email_verified baked into it as of whenever it was issued (up to ~1hr
    // ago, before this user verified), and Firebase keeps reusing it as-is until it
    // naturally expires unless force-refreshed. Without this, the app would report
    // "verified!" and navigate onward, then immediately bounce right back to
    // verify-email the moment any screen makes an API call, since the backend would
    // still be reading the old, stale, unverified token — the exact redirect loop this
    // fixes.
    if (verified) await auth.currentUser.getIdToken(true);

    return verified;
  };

  return (
    <AuthContext.Provider
      value={{ user, initializing, register, login, logout, resetPassword, resendVerificationEmail, refreshEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
