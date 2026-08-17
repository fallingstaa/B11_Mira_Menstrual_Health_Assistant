# Mira Backend API

Backend service for Mira - Teen Menstrual Health Assistant.

## Technology

- Node.js / Express 5
- MongoDB Atlas (via Mongoose)
- Firebase Authentication (Admin SDK — token verification only, no passwords stored here)
- Gemini API (integration point wired, not yet implemented — see Current Status)

## Setup

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or any MongoDB connection string)
- A Firebase project with a service account (Admin SDK) **and** Email/Password sign-in enabled under Authentication → Sign-in method

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `PORT` | Port the API listens on (defaults to `5000`) |
| `MONGODB_URI` | MongoDB Atlas (or other) connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key. Paste it as a single line with `\n` in place of real newlines — `config/firebase.js` converts them back automatically |
| `GEMINI_API_KEY` | API key for the Gemini API (not yet consumed by any code path — see Current Status) |

Never commit `.env` or raw Firebase service account JSON — `.gitignore` already excludes common names for these (`serviceAccountKey.json`, `*-firebase-adminsdk-*.json`, etc.). These are **Admin SDK secrets** and must never end up in the mobile app's bundle — the mobile app uses a separate, non-secret Firebase Web config (see `mobile-app/.env.example`).

### 3. Start the server

Development (auto-restarts on changes):

```bash
npm run dev
```

Production:

```bash
npm start
```

### 4. Verify it's running

- `GET /` → `{ "message": "Mira Backend API is running" }`
- `GET /api/health` → reports API status and confirms Mongo/Firebase initialized without errors on startup

### 5. API docs (Swagger)

Interactive docs, generated from `@openapi` JSDoc blocks in `src/routes/*.js` (spec assembled in `config/swagger.js`):

- `GET /api/docs` → Swagger UI — click **Authorize** and paste a Firebase ID token once to test any authenticated endpoint from the browser
- `GET /api/docs.json` → the raw OpenAPI 3 spec, importable into Postman/Insomnia

Endpoint docs describe what each controller *actually* returns today — remaining known gaps (`ragService`/`geminiService` still stubbed, no `EducationalContent` seed data) are called out directly in the relevant endpoint's description rather than tracked separately.

### 6. Test UI (dev only)

`GET /test-ui` — a small dashboard (`public/test-ui/index.html`, no build step) for clicking through profile/calendar/prediction/reminders without hand-typing JSON into Swagger or wiring up the real mobile app. Has its own in-page sign-in (mints a real Firebase ID token client-side, same as the app does) plus a one-click "Quick sign-in: dev tester" button.

Backed by `GET /api/dev/config`, which hands the page the same `TEST_FIREBASE_WEB_API_KEY`/`TEST_USER_EMAIL`/`TEST_USER_PASSWORD` from `.env` that `scripts/get-test-token.js` uses (see §5 above) — set those once and both tools work. Both the page and its config route are skipped entirely when `NODE_ENV=production`, so there's nothing to disable before a real deploy.

Deliberately doesn't cover AI Assistant or Education — those are scoped out until there's real knowledge-source content and article copy to test against (see Current Status below).

## Current Status

**Implemented and verified working end to end** (against real Firebase + real MongoDB Atlas, not just unit-tested):

- Full REST API — 6 resources (`auth`, `profile`, `menstrual`, `ai`, `reminders`, `education`), 17 endpoints total, all mounted under `/api`
- 6 Mongoose models (`User` — with embedded profile/cycle-cache/preferences, `MenstrualRecord`, `AIConversation`, `NotificationReminder`, `EducationalContent`, `KnowledgeSource`)
- Auth: Firebase ID token verification middleware (`src/middleware/authMiddleware.js`), applied to every user-scoped route; `POST /api/auth/register` and `/login` sync a Mongo `User` doc from a verified token
- `/api/auth/login` **self-heals** a partial registration (Firebase account exists but no matching Mongo doc, e.g. from a dropped connection mid-signup) by creating the missing doc instead of erroring
- Centralized error handling (`middleware/errorHandler.js`, `middleware/notFound.js`) — no unhandled route or thrown error reaches the client as a raw stack trace
- Crash-hardening: persistent Mongo connection error/disconnect/reconnect listeners (an unhandled `'error'` event on a Mongoose connection otherwise crashes the whole process, even long after a successful startup), plus process-level `unhandledRejection`/`uncaughtException` logging so a future crash is diagnosable instead of a silent dead end
- `predictionService.js` — real cycle-phase/next-period date math, no external dependency
- Cycle/menstrual record CRUD (`/api/menstrual/*`) — upsert-by-day, date-range queries, period-end-day exclusivity logic
- `cycleCacheService.js` — recomputes `User.cycle` (last period dates, running cycle/period-length averages, next-period + fertile-window prediction) from actual `MenstrualRecord` history after every write, so `GET /api/menstrual/prediction` and the `cycle` block on `GET /api/profile/me` stay in sync with what's actually been logged instead of frozen at defaults
- `DELETE /api/profile/me` — irreversible account + personal-data deletion (`MenstrualRecord`/`AIConversation`/`NotificationReminder` docs, the Mongo `User` doc, then the Firebase account itself)
- `notificationService.js` — `GET /api/reminders` lazily generates whatever's newly due (period-starting-soon within 3 days, a daily check-in nudge, an unfinished-period nudge) before listing, deduped so repeated calls don't create duplicates and marking one read survives regeneration. No FCM push delivery yet, and "education"-type reminders aren't generated (no seeded content to link to) — see notificationService.js
- Interactive Swagger docs at `GET /api/docs` (spec at `GET /api/docs.json`), generated from `@openapi` JSDoc blocks in `src/routes/*.js`; `npm run token` mints a Firebase ID token for a standing dev test account so protected endpoints can be tried out without touching the mobile app (see `scripts/get-test-token.js`)
- Dev-only test dashboard at `GET /test-ui` (see §6 above)
- `?asOf=YYYY-MM-DD` on `GET /api/menstrual/prediction` and `GET /api/reminders` (dev only — see `utils/devClock.js`) — simulates a different "today" so date-dependent logic (reminder windows, current cycle day/phase) can be exercised on demand instead of waiting real days for it to become true
- Schema validation (Zod) on every `POST`/`PUT` body (`src/validators/*.js` + `middleware/validate.js`) — replaces the old manual `if (!field) return error(...)` checks scattered across controllers with one consistently-formatted 400 per route
- CORS restricted to `ALLOWED_ORIGINS` when `NODE_ENV=production` (wide open in dev, where the Expo dev server's origin varies) — see `config/cors.js`
- Rate limiting (`middleware/rateLimiters.js`) — a generous floor across the whole API, with a tighter limit specifically on `/api/auth/*` against brute-force/credential-stuffing/signup-spam
- Fixed a user-enumeration leak in `POST /api/auth/forgot-password`: a real email returned 200 but a non-existent one 500'd (found via testing, not previously known) — both now return the same response

**Not yet implemented (deliberately stubbed, not forgotten):**

- `geminiService.js` / `ragService.js` — `POST /api/ai/ask` works end to end and creates a real `AIConversation` record, but returns a canned placeholder reply rather than a real Gemini call. `language`/`sources` from the API design doc aren't wired in either. Deliberately saved for last — needs real knowledge-source content to ground answers in first.
- Push delivery (Firebase Cloud Messaging) for reminders — they're generated and listable, just not pushed
- No seed data — `EducationalContent`/`KnowledgeSource` collections are empty until manually populated
