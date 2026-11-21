# Mira – Teen Menstrual Health Assistant Mobile Application

A bilingual (English and Khmer) mobile app that helps Cambodian adolescents track their menstrual cycle, learn about menstrual health, and ask questions to a safety-guarded AI assistant that answers only from verified medical sources.

**Final-year project** – Kirirom Institute of Technology, Batch 11, Group B11-P08
**Student:** Moth Liya · **Supervisor:** Mr. Leo Fernandez · November 2026

> **Note on the name:** the thesis calls the project **Mira**. During development the app's display name in the code was changed to **Yumi**, so some screens, folders and commit messages say "Yumi". Both names refer to the same project.

---

## Thesis release

The version described in the thesis is tagged **`v1.0-thesis`** (commit `130047e`).

```bash
git clone https://github.com/fallingstaa/B11_Mira_Menstrual_Health_Assistant.git
cd B11_Mira_Menstrual_Health_Assistant
git checkout v1.0-thesis
```

---

## Features

- **Secure accounts:** Firebase email/password sign-up with email verification; the session is stored encrypted (AES-256) on the device
- **Daily logging:** period days, flow, symptoms, mood and notes, with future-date and past-month locks
- **Cycle prediction:** average-based prediction of the next period, fertile window and cycle phase, shown on a calendar
- **Education Hub:** six offline topics with interactive cards, each citing its sources
- **AI assistant (RAG):** answers only from a curated knowledge base (ACOG, UNICEF Cambodia, CDC, WHO, NHS, Cleveland Clinic) with tappable source chips
  - Safety layer 1: refuses diagnosis and medication/dosage questions
  - Safety layer 2: refuses questions with no relevant source (cosine similarity below 0.78)
- **English and Khmer** for the whole interface and the AI answers
- **Reminders, data export and account deletion**

---

## Tech stack

| Part | Technology |
| --- | --- |
| Mobile app | React Native 0.88, Expo SDK 58, Expo Router, TypeScript, i18next |
| Backend | Node.js 24, Express 5, Mongoose 9, Zod 4 |
| Database | MongoDB Atlas with Atlas Vector Search |
| Authentication | Firebase Authentication (firebase-admin on the server) |
| AI | Google Gemini (gemini-3.1-flash-lite, gemini-3.5-flash-lite, gemini-embedding-001) |
| Testing | Jest 30, Supertest, mongodb-memory-server |
| Deployment | Render (backend), EAS Build (Android APK) |

---

## Repository structure

```text
backend/        Express REST API
  src/          controllers, middleware, models, routes, services, validators, tests
  data/         knowledge-base.csv (30 chunks)
  scripts/      seed-knowledge-base.js and helper scripts
mobile-app/     Expo / React Native app
  src/app/      screens (file-based routing)
  src/i18n/     English and Khmer translations
render.yaml     Render deployment (Blueprint)
```

---

## Run the automated tests

No cloud services or accounts are needed (in-memory MongoDB, Firebase mocked).

```bash
cd backend
npm install
npm test
```

Expected result: **9 test suites, 97 tests passed.**

---

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in your own MongoDB, Firebase and Gemini values
npm run seed:kb           # loads the knowledge base and creates embeddings
npm run dev               # http://localhost:5000/api/health
```

In MongoDB Atlas, create a Vector Search index named `vector_index` on the `knowledgechunks` collection (field `embedding`, 3072 dimensions, cosine similarity).
API documentation (Swagger) is available at `/api/docs`.

### Mobile app

```bash
cd mobile-app
npm install --legacy-peer-deps
cp .env.example .env      # set EXPO_PUBLIC_API_URL and the Firebase web config
npx expo start            # open in Expo Go
```

Android APK: `eas build -p android --profile preview`

More details: [backend/README.md](backend/README.md) and [mobile-app/README.md](mobile-app/README.md).

---

## Security and privacy

- No secrets are stored in this repository. Each part reads its keys from a `.env` file (not committed); `.env.example` lists the variable names only.
- Every database query is scoped to the authenticated user; there is no admin role.
- No personal data (name, email, health records) is sent to the AI provider.

---

## Disclaimer

Mira is an educational tool developed for an academic project. It does not provide medical diagnosis or treatment. Users with health concerns should talk to a doctor, school nurse or trusted adult.
