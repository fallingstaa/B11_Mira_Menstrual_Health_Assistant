# Mira Backend API

Backend service for Mira - Teen Menstrual Health Assistant.

## Technology

- Node.js
- Express.js
- MongoDB Atlas
- Firebase Authentication
- Gemini API

## Setup

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or any MongoDB connection string)
- A Firebase project with a service account (Admin SDK)

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
| `GEMINI_API_KEY` | API key for the Gemini API |

Never commit `.env` or raw Firebase service account JSON — `.gitignore` already excludes common names for these (`serviceAccountKey.json`, `*-firebase-adminsdk-*.json`, etc.).

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

Backend API structure created.
Database integration pending.