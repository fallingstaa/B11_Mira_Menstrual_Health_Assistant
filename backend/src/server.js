// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Test Route
// app.get("/", (req, res) => {
//   res.json({
//     message: "Mira Backend API is running 🚀",
//   });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


const express = require("express");
require("dotenv").config();

const app = express();

const testRoutes = require("./routes/testRoutes");


app.use("/api", testRoutes);

const PORT = process.env.PORT || 5000;


// Middleware
app.use(express.json());


// Test Route
app.get("/", (req, res) => {
    res.json({
        message: "Mira Backend API is runningggggggg"
    });
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});