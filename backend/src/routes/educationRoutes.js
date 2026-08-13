const express = require("express");

const { listArticles, getArticleById } = require("../controllers/educationController");

const router = express.Router();

// Public/shared content — no auth required (Security Design 14.2: EducationalContent
// is a shared read collection, not owned by any single user).
router.get("/articles", listArticles);
router.get("/articles/:id", getArticleById);

module.exports = router;
