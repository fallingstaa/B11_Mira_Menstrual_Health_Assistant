# Yumi Mobile App

Expo/React Native app for Yumi - Teen Menstrual Health Assistant, targeting first-time menstruators.

## Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` skips an optional `react-native-windows` peer dependency of the date picker that would otherwise stop the install; the app doesn't use it.

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

**Expo Go version note:** this project is on **Expo SDK 58**, matching the current App Store / Play Store Expo Go. Expo Go only runs one SDK version, so when the store version moves to a newer SDK, upgrade the project to match (`npx expo install expo@^<sdk> --fix -- --legacy-peer-deps`, then `npx expo-doctor`).

## Languages (English / Khmer)

All UI text goes through [i18next](https://www.i18next.com/) — never hard-code user-facing English in a screen.

- **UI text:** `src/i18n/locales/en.ts` (source of truth) and `src/i18n/locales/km.ts`. In a component: `const { t } = useTranslation();` then `t('home.welcomeTitle')`. Both the keys and the Khmer file's shape are type-checked, so a typo'd key or a missing Khmer string fails `npx tsc --noEmit`.
- **Education content:** English stays in `src/constants/education-hub.ts` / `education-activities.ts`; the Khmer text lives in the matching `*.km.ts` files (text only, matched by id/position). Read it through `getEducationTopics()` / `getActivities()` so it follows the language.
- **Language choice:** saved on the device (`src/i18n/index.ts`), switchable before login (EN | ខ្មែរ toggle on onboarding/login/register) or from Profile → Language, which also saves it to the account.
- **Khmer font:** Poppins has no Khmer glyphs, so `AppText` and text inputs switch to the Koh Santepheap font with taller line height (`src/i18n/fonts.ts`).
- The Khmer text is a first draft — health wording should be reviewed by a native speaker before release.

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
