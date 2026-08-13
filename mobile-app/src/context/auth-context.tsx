import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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

  return (
    <AuthContext.Provider value={{ user, initializing, register, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
