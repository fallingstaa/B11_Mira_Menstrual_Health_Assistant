const express = require("express");
require("dotenv").config();

const connectDB = require("../config/database");
require("../config/firebase");

const app = express();
const PORT = process.env.PORT || 5000;



// Middleware
app.use(express.json());

// Database connection
connectDB();

// Routes
const healthRoutes = require("./routes/healthRoutes");
app.use("/api", healthRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Mira Backend API is running"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});