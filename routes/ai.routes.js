const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { aiRateLimiter, validateChatMessage } = require("../middleware/ai.middleware");
const aiController = require("../controllers/ai.controller");

router.post("/chat", isAuthenticated, aiRateLimiter, validateChatMessage, aiController.chatWithAssistant);

module.exports = router;
