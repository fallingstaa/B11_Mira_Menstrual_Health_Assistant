# Mira Mobile App

Expo/React Native app for Mira - Teen Menstrual Health Assistant, targeting first-time menstruators.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

| Variable | Where to get it |
| --- | --- |
| `EXPO_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Firebase Console → Project Settings → General → Your apps → Web app. This is a **separate, non-secret** config from the backend's Admin SDK credentials — safe to ship in the app bundle. |
| `EXPO_PUBLIC_API_URL` | Where the backend is reachable from your device. `http://localhost:5000` works for web/simulator; a **physical device via Expo Go needs your computer's LAN IP instead** (e.g. `http://192.168.1.23:5000`) — `localhost` on a phone means the phone itself. |

Also required, one-time, in Firebase Console: **Authentication → Sign-in method → enable Email/Password**. Without it, register/login fail even with a correct `.env`.

### 3. Start the backend first

The app talks to the real backend for auth and (increasingly) app data — see `../backend/README.md`. Start it before testing:

```bash
cd ../backend && npm run dev
```

### 4. Start the app

```bash
npx expo start
```

Scan the QR code with **Expo Go**, or press `a`/`i` for an Android/iOS emulator.

**Expo Go version note:** this project is pinned to **Expo SDK 54** deliberately — not the latest. SDK 55+ isn't published to the public App Store's Expo Go build yet, so a newer SDK means iOS testing requires either a signed `sign.expo.dev` build (re-signs every 7 days on a free Apple ID) or a custom EAS dev-client build. SDK 54 works with the plain App Store/Play Store Expo Go app with no extra setup. Don't bump `expo` in `package.json` without checking this is still true.

## Current Status

**Wired to the real backend (Firebase + MongoDB, not mock data):**

- `login.tsx`, `register.tsx`, `forgot-password.tsx` — full auth flow via `context/auth-context.tsx`
- `(tabs)/profile.tsx` — loads the real signed-in user via `GET /api/profile/me`, persists the notification/check-in toggles via `PUT /api/profile/me`, and logout is real
- `utils/api.ts` — shared authenticated-fetch helper (attaches a fresh Firebase ID token per request) used by all of the above; every other screen that gets wired to the backend should go through this, not a one-off `fetch`

**Still running on `constants/mock-data.ts` / local-only `context/app-state.tsx` state (not yet connected to the backend):**

- `(tabs)/home.tsx`, `(tabs)/calendar.tsx`, `(tabs)/education.tsx`, `(tabs)/assistant.tsx`
- `checkin.tsx`, `record.tsx`, `prediction.tsx`, `notifications.tsx`, `article/[id].tsx`
- Profile screen's edit button (pencil icon) — no edit form/modal built yet

So today: you can create a real account and log in/out for real, and Profile shows your actual data — but everything past that (cycle stats, articles, chat, notifications) is still the same fake prototype data regardless of which account is logged in. The backend already has working, tested endpoints for all of this (`/api/menstrual/*`, `/api/ai/*`, `/api/reminders`, `/api/education/*`) — rewiring each screen to call them via `apiRequest()` instead of importing from `mock-data.ts` is the remaining work.

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/) — this project uses file-based routing under `src/app/`
