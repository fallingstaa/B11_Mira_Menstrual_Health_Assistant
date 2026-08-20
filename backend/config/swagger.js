const swaggerJsdoc = require("swagger-jsdoc");

/**
 * Central OpenAPI 3 definition for the Mira API. The `apis` glob below pulls in
 * `@openapi` JSDoc blocks written directly above each route in src/routes/*.js —
 * keeping the docs next to the code they describe instead of one giant separate file.
 *
 * Schemas here describe what the controllers *actually* return today, not the
 * aspirational shape from the API design doc — where the two differ (e.g. /api/ai/ask
 * not yet returning `language`/`sources`, list endpoints returning Mongo's `_id`
 * instead of `turnId`/`contentId`), the annotation says so. Fix the code, then the docs
 * follow — not the other way around.
 */
const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Mira API",
    version: "1.0.0",
    description:
      "Backend API for Mira, a menstrual health assistant for teens. All routes are mounted under `/api`. " +
      "Every route except `/api/auth/*`, `/api/health`, and `/api/education/*` requires a Firebase ID token " +
      "(`Authorization: Bearer <token>`) — use the **Authorize** button below to set it once for this whole page.",
  },
  servers: [{ url: "/", description: "Same origin as this docs page" }],
  tags: [
    { name: "Auth", description: "Firebase-token-based registration/login/password reset" },
    { name: "Profile", description: "The signed-in user's own profile, preferences, and cycle cache" },
    { name: "Menstrual Tracking", description: "Per-day period logs and cycle prediction" },
    { name: "AI Assistant", description: "RAG-grounded Q&A with Mira" },
    { name: "Reminders", description: "In-app notifications/reminders" },
    { name: "Education", description: "Read-only educational articles" },
    { name: "System", description: "Liveness check" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Firebase ID Token",
        description: "Paste a Firebase ID token (not a password, not a custom token) — e.g. from the client SDK's `getIdToken()`.",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Detailed description of what went wrong." },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          message: { type: "string" },
        },
      },
      Preferences: {
        type: "object",
        properties: {
          pushNotifications: { type: "boolean" },
          checkinReminders: { type: "boolean" },
        },
      },
      CycleCache: {
        type: "object",
        description: "Denormalized cache on the User doc — see predictionService.js. Null fields mean no period has been logged yet.",
        properties: {
          averageCycleLength: { type: "integer", example: 28 },
          averagePeriodLength: { type: "integer", example: 5 },
          lastPeriodStart: { type: "string", format: "date", nullable: true },
          lastPeriodEnd: { type: "string", format: "date", nullable: true },
          nextPeriodStart: { type: "string", format: "date", nullable: true },
          nextPeriodEnd: { type: "string", format: "date", nullable: true },
          fertileWindowStart: { type: "string", format: "date", nullable: true },
          fertileWindowEnd: { type: "string", format: "date", nullable: true },
          manualCycleLength: {
            type: "integer",
            nullable: true,
            description: "Onboarding's own answer, if given — see PUT /api/menstrual/cycle-setup. Only used as a fallback while averageCycleLength above can't yet be computed from real history.",
          },
          manualPeriodLength: { type: "integer", nullable: true, description: "Same idea as manualCycleLength, for averagePeriodLength." },
        },
      },
      RegisterResponse: {
        type: "object",
        properties: {
          userId: { type: "string" },
          name: { type: "string" },
          age: { type: "integer", nullable: true },
          email: { type: "string", format: "email" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          userId: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          onboarding: {
            type: "object",
            properties: {
              firstPeriodRecorded: { type: "boolean" },
              firstQuestionAsked: { type: "boolean" },
              isBeginner: { type: "boolean" },
            },
          },
        },
      },
      Profile: {
        type: "object",
        properties: {
          userId: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          age: { type: "integer", nullable: true },
          dateOfBirth: { type: "string", format: "date", nullable: true },
          preferredLanguage: { type: "string", example: "English" },
          preferences: { $ref: "#/components/schemas/Preferences" },
          onboarding: {
            type: "object",
            properties: {
              firstPeriodRecorded: { type: "boolean" },
              firstQuestionAsked: { type: "boolean" },
              isBeginner: { type: "boolean" },
            },
          },
          cycle: { $ref: "#/components/schemas/CycleCache" },
        },
      },
      ProfileUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer", minimum: 9, maximum: 100 },
          dateOfBirth: { type: "string", format: "date" },
          preferredLanguage: { type: "string" },
          preferences: { $ref: "#/components/schemas/Preferences" },
        },
      },
      ProfileUpdateResponse: {
        type: "object",
        properties: {
          userId: { type: "string" },
          name: { type: "string" },
          age: { type: "integer", nullable: true },
          dateOfBirth: { type: "string", format: "date", nullable: true },
          preferredLanguage: { type: "string" },
          preferences: { $ref: "#/components/schemas/Preferences" },
        },
      },
      PredictionResponse: {
        type: "object",
        properties: {
          currentDay: { type: "integer", nullable: true, description: "Null until a period has ever been logged." },
          averageCycleLength: { type: "integer" },
          averagePeriodLength: { type: "integer" },
          nextPeriodStart: { type: "string", format: "date", nullable: true },
          nextPeriodEnd: { type: "string", format: "date", nullable: true },
          fertileWindowStart: { type: "string", format: "date", nullable: true },
          fertileWindowEnd: { type: "string", format: "date", nullable: true },
          phase: {
            type: "string",
            nullable: true,
            enum: ["Menstrual phase", "Follicular phase", "Ovulation phase", "Luteal phase", null],
          },
        },
      },
      MenstrualRecord: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          date: { type: "string", format: "date" },
          isPeriodDay: { type: "boolean" },
          isPeriodEnd: { type: "boolean", description: "At most one record per user has this set to true." },
          status: { type: "string", nullable: true, enum: ["on", "spotting", "off", null] },
          flowLevel: { type: "string", nullable: true, example: "medium" },
          symptoms: { type: "array", items: { type: "string" }, example: ["cramps", "headache"] },
          mood: { type: "string", nullable: true, example: "calm" },
          notes: { type: "string", example: "Felt tired today" },
          source: { type: "string", enum: ["calendar", "checkin", "record", "record_first_period", "last_period_one_date"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MenstrualRecordUpsertRequest: {
        type: "object",
        required: ["date", "source"],
        properties: {
          date: { type: "string", format: "date", example: "2026-08-10" },
          isPeriodDay: { type: "boolean" },
          isPeriodEnd: { type: "boolean" },
          status: { type: "string", enum: ["on", "spotting", "off"] },
          flowLevel: { type: "string", example: "medium" },
          symptoms: { type: "array", items: { type: "string" } },
          mood: { type: "string", example: "calm" },
          notes: { type: "string" },
          source: { type: "string", enum: ["calendar", "checkin", "record", "record_first_period", "last_period_one_date"] },
        },
      },
      AskRequest: {
        type: "object",
        required: ["question"],
        properties: {
          question: { type: "string", example: "Why do I get cramps?" },
          language: {
            type: "string",
            example: "English",
            description: "Accepted by the request body today, but NOT YET stored/used by aiController.js — see backend to-do list.",
          },
        },
      },
      AskResponse: {
        type: "object",
        properties: {
          turnId: { type: "string" },
          question: { type: "string" },
          aiResponse: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
        description: "The API design doc also specs `language` and `sources` on this response — not implemented yet (ragService.js/geminiService.js are still placeholders).",
      },
      ConversationTurn: {
        type: "object",
        properties: {
          _id: { type: "string" },
          question: { type: "string" },
          aiResponse: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      NotificationReminder: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          type: { type: "string", enum: ["period", "record", "checkin", "education"] },
          title: { type: "string" },
          body: { type: "string" },
          relatedContentId: { type: "string", nullable: true },
          scheduledFor: { type: "string", format: "date-time", nullable: true },
          sentAt: { type: "string", format: "date-time", nullable: true },
          read: { type: "boolean" },
          readAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      EducationalArticleSummary: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          category: { type: "string" },
        },
      },
      EducationalArticleDetail: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          category: { type: "string" },
          body: { type: "array", items: { type: "string" } },
          sourceId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          message: { type: "string", example: "Mira API is healthy" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Missing required parameters or invalid input format.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      Unauthorized: {
        description: "Missing, invalid, or expired Firebase Authorization token.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      NotFound: {
        description: "Requested resource does not exist.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      ServerError: {
        description: "Server error or third-party service failure.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  definition: swaggerDefinition,
  // Route files hold the per-endpoint @openapi blocks; server.js only mounts the UI.
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
