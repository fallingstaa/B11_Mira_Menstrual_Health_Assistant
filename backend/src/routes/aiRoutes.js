const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { ask, getConversation } = require("../controllers/aiController");

const router = express.Router();

router.use(authMiddleware);
router.post("/ask", ask);
router.get("/conversation", getConversation);

module.exports = router;
