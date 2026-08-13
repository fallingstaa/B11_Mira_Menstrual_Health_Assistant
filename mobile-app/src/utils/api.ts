import { auth } from '@/config/firebase';

// Where the Express backend is reachable from this device. "localhost" only works for
// web/iOS-simulator — a physical device via Expo Go needs the dev machine's LAN IP
// instead (e.g. http://192.168.1.23:5000), set via EXPO_PUBLIC_API_URL in .env.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach the signed-in user's ID token as a Bearer header. Defaults to true — pass false for auth/register, auth/login, and public education endpoints. */
  auth?: boolean;
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
  { method = 'GET', body, auth: needsAuth = true }: RequestOptions = {},
): Promise<T> {
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
    console.error(`[api] ✗ network error calling ${url} — is the backend running and reachable from this device?`, networkErr);
    throw new Error(`Can't reach the server at ${API_URL}. Check the backend is running and EXPO_PUBLIC_API_URL is correct.`);
  }

  const json = await res.json().catch((parseErr) => {
    console.error(`[api] ✗ ${method} ${url} returned non-JSON (status ${res.status})`, parseErr);
    throw new Error(`Unexpected response from server (status ${res.status}).`);
  });

  if (!res.ok || json.status === 'error') {
    console.error(`[api] ✗ ${method} ${url} →`, res.status, json);
    throw new Error(json.message ?? `Request failed (${res.status})`);
  }

  console.log(`[api] ✓ ${method} ${url} →`, res.status);
  return json.data ?? json;
}
