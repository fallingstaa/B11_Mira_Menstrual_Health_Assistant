const express = require("express");

const menstrualRoutes = require("../../../routes/menstrualRoutes");
const errorHandler = require("../../../middleware/errorHandler");

/**
 * Test-only Express app: the real menstrual router (real authMiddleware, validators,
 * controllers and services) plus the real errorHandler, mounted exactly as server.js does.
 * Deliberately omits server.js's connectDB(), app.listen() and rate limiter, so a test can
 * point mongoose at the in-memory database and drive the app through supertest.
 */
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use("/api/menstrual", menstrualRoutes);
app.use(errorHandler);

module.exports = app;
