const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { getMe, updateMe } = require("../controllers/profileController");

const router = express.Router();

router.use(authMiddleware);
router.get("/me", getMe);
router.put("/me", updateMe);

module.exports = router;
