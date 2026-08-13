const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { getPrediction, listRecords, upsertRecord, deleteRecord } = require("../controllers/menstrualController");

const router = express.Router();

router.use(authMiddleware);
router.get("/prediction", getPrediction);
router.get("/records", listRecords);
router.post("/records", upsertRecord);
router.delete("/records/:date", deleteRecord);

module.exports = router;
