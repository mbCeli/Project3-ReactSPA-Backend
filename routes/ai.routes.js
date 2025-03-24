const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const aiController = require("../controllers/ai.controller");

router.post("/chat", isAuthenticated, aiController.chatWithAssistant);

module.exports = router;
