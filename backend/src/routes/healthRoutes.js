const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
    res.json({
        status: "success",
        message: "Mira API is healthy",
        timestamp: new Date()
    });
});

module.exports = router;