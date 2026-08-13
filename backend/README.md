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

**Not yet implemented (deliberately stubbed, not forgotten):**

- `geminiService.js` / `ragService.js` — `POST /api/ai/ask` works end to end and creates a real `AIConversation` record, but returns a canned placeholder reply rather than a real Gemini call
- `notificationService.js` — no push delivery (Firebase Cloud Messaging) yet; `/api/reminders` only supports listing/marking existing records read
- Request-body validation is manual (enum checks against `utils/constants.js`) rather than a schema-validation library
- CORS is fully open (`app.use(cors())`) — needs restricting to the app's real origin before any production deployment
- No seed data — `EducationalContent`/`KnowledgeSource` collections are empty until manually populated
- No account-deletion endpoint yet (flagged in the security design as a needed addition for real data-ownership rights)
