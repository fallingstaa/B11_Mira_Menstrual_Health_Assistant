const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("../config/database");
require("../config/firebase");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

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
// TODO: restrict origin to the app's real domain(s) before production (Security Design 14.4) —
// left permissive for now since the Expo dev client's origin varies.
app.use(cors());
app.use(express.json());

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