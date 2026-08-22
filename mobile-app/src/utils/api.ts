import { router } from 'expo-router';

import { auth } from '@/config/firebase';

// Where the Express backend is reachable from this device. "localhost" only works for
// web/iOS-simulator — a physical device via Expo Go needs the dev machine's LAN IP
// instead (e.g. http://192.168.1.23:5000), set via EXPO_PUBLIC_API_URL in .env.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

/**
 * Thrown for a { status: "error" } response — same as a plain Error, but keeps the
 * backend's machine-readable `code` (see backend/src/utils/responseHandler.js) around
 * so a caller can branch on *which* error this is instead of matching on `message`
 * text, which is free to change wording without warning.
 */
export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach the signed-in user's ID token as a Bearer header. Defaults to true — pass false for auth/register, auth/login, and public education endpoints. */
  auth?: boolean;
  /**
   * Downgrades this call's own failure logging from console.error to console.warn. Use for a
   * call whose caller already expects a failure might happen and handles it itself (e.g. a
   * retry loop) — React Native's LogBox pops its intrusive red-screen "Console Error" overlay
   * on any console.error, which reads as a crash even when the code recovers from it a moment
   * later (console.warn only shows a small dismissible banner). The caller's own eventual
   * console.error, if it still fails after retrying, is what should trigger that overlay —
   * not every individual attempt along the way.
   */
  quiet?: boolean;
};

/**
 * Thin fetch wrapper around Mira's backend. Always requests a *fresh* ID token from
 * the Firebase SDK rather than caching one — tokens expire hourly and the SDK
 * auto-refreshes them under the hood, so asking fresh every time avoids ever sending
 * a stale one. Every response is expected to follow the backend's
 * { status: "success"|"error", data|message } envelope.
 */
export async function apiRequest<T = unknown>(
  path: string,
  { method = 'GET', body, auth: needsAuth = true, quiet = false }: RequestOptions = {},
): Promise<T> {
  const log = quiet ? console.warn : console.error;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (needsAuth) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not signed in');
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_URL}/api${path}`;
  console.log(`[api] → ${method} ${url}`, needsAuth ? '(authed)' : '(no auth)');

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // A thrown fetch (not an HTTP error status) means the request never reached the
    // server at all — almost always EXPO_PUBLIC_API_URL being unreachable from this
    // device (wrong LAN IP, backend not running, phone on a different network) rather
    // than anything wrong with the request itself.
    log(`[api] ✗ network error calling ${url} — is the backend running and reachable from this device?`, networkErr);
    throw new Error(`Can't reach the server at ${API_URL}. Check the backend is running and EXPO_PUBLIC_API_URL is correct.`);
  }

  const json = await res.json().catch((parseErr) => {
    log(`[api] ✗ ${method} ${url} returned non-JSON (status ${res.status})`, parseErr);
    throw new Error(`Unexpected response from server (status ${res.status}).`);
  });

  if (!res.ok || json.status === 'error') {
    log(`[api] ✗ ${method} ${url} →`, res.status, json);
    // Global safety net: whichever screen happened to make the call that first hit an
    // unverified account, send it to the verify-email screen instead of just showing
    // "Please verify your email" as an inline form error the user has no way to act on.
    if (json.code === 'EMAIL_NOT_VERIFIED') {
      // Cast needed until expo-router's generated route types (.expo/types/router.d.ts)
      // pick up this new screen on the next `expo start`/`expo export` — same reason
      // verify-email.tsx casts its own dynamic `destination` param.
      router.replace('/verify-email' as never);
    }
    throw new ApiError(json.message ?? `Request failed (${res.status})`, json.code);
  }

  console.log(`[api] ✓ ${method} ${url} →`, res.status);
  return json.data ?? json;
}

/**
 * Same envelope/error handling as apiRequest, but for a multipart body (avatar upload) —
 * apiRequest always JSON.stringifies and forces Content-Type: application/json, neither
 * of which multipart wants. Deliberately not setting Content-Type here at all: fetch/RN
 * needs to generate it itself (including the multipart boundary) from the FormData body.
 */
export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not signed in');

  const url = `${API_URL}/api${path}`;
  console.log(`[api] → POST ${url} (upload)`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch (networkErr) {
    console.error(`[api] ✗ network error uploading to ${url}`, networkErr);
    throw new Error(`Can't reach the server at ${API_URL}. Check the backend is running and EXPO_PUBLIC_API_URL is correct.`);
  }

  const json = await res.json().catch((parseErr) => {
    console.error(`[api] ✗ POST ${url} returned non-JSON (status ${res.status})`, parseErr);
    throw new Error(`Unexpected response from server (status ${res.status}).`);
  });

  if (!res.ok || json.status === 'error') {
    console.error(`[api] ✗ POST ${url} →`, res.status, json);
    throw new Error(json.message ?? `Request failed (${res.status})`);
  }

  console.log(`[api] ✓ POST ${url} →`, res.status);
  return json.data ?? json;
}
