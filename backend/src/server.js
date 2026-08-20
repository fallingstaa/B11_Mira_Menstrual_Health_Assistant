const path = require("path");

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const connectDB = require("../config/database");
require("../config/firebase");
const swaggerSpec = require("../config/swagger");
const buildCorsOptions = require("../config/cors");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiters");

const app = express();
const PORT = process.env.PORT || 5000;

// Last-resort safety nets: without these, an error thrown outside a request handler
// (a rejected promise nothing awaited, a callback throw, etc.) prints nothing useful —
// nodemon just reports "app crashed" with no stack trace, exactly what happened
// tracking down an earlier crash. Logging first means the *next* one is diagnosable
// instead of a dead end.
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
});



// Middleware
// See config/cors.js — wide open in dev (Expo's origin varies), restricted to
// ALLOWED_ORIGINS in production.
app.use(cors(buildCorsOptions()));
// Default 100kb is tight enough that a full 90-entry POST /api/menstrual/records/batch
// (each entry with a max-length notes field + several symptoms) can exceed it — bumped
// so that endpoint's documented cap is reliably true rather than an occasional 413.
app.use(express.json({ limit: "1mb" }));
// Whole-API floor against runaway loops/scripts — see middleware/rateLimiters.js.
// authRoutes.js layers a tighter limit on top of this for register/login/forgot-password.
app.use("/api", apiLimiter);

// Database connection
connectDB();

// Routes
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const menstrualRoutes = require("./routes/menstrualRoutes");
const aiRoutes = require("./routes/aiRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const educationRoutes = require("./routes/educationRoutes");

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/menstrual", menstrualRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/education", educationRoutes);

// Interactive API docs + machine-readable spec, generated from @openapi JSDoc blocks
// in src/routes/*.js (see config/swagger.js). Use the "Authorize" button in the UI to
// paste a Firebase ID token once and it's sent on every "Try it out" call.
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "Mira API Docs" }));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

// Dev-only test dashboard (public/test-ui) — a friendlier alternative to hand-typing
// JSON into Swagger while the real mobile app isn't wired to this backend yet. Both
// the static page and the /api/dev/config it depends on are skipped entirely outside
// dev, so there's no production-time cost or exposure to reason about.
//
// Deliberately *not* committed to the repo (see .gitignore) — it's a personal local
// tool, not shared project code. The try/catch below is what makes that safe: without
// it, anyone who clones the repo (or checks out a branch) without these local-only
// files would hit a crash-on-boot the moment `require("./routes/devRoutes")` fails to
// resolve. This way it's silently skipped instead — dev.tools present -> mounted, dev
// tools absent -> the rest of the API still boots normally.
if (process.env.NODE_ENV !== "production") {
    try {
        const devRoutes = require("./routes/devRoutes");
        app.use("/api/dev", devRoutes);
        app.use("/test-ui", express.static(path.join(__dirname, "../public/test-ui")));
    } catch (err) {
        console.log("[dev] Skipping /test-ui + /api/dev/config — not present on this machine (that's expected if you don't have the local-only dev tooling).");
    }
}

app.get("/", (req, res) => {
    res.json({
        message: "Mira Backend API is running"
    });
});

// 404 + centralized error handling — must be registered last, after every route above.
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});