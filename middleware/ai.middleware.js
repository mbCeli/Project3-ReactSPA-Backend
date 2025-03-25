const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");

// Rate limiter for AI (how many requests can be done in a certain period of time)
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    message:
      "Too many requests from this IP, please try again after 15 minutes",
    type: "rate_limit_exceeded",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation for chat messages (sanitization)
const validateChatMessage = [
  body("message")
    .notEmpty()
    .withMessage("Message cannot be empty")
    .isString()
    .withMessage("Message must be a string")
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage("Message cannot exceed 500 characters"),
];

module.exports = {
  aiRateLimiter,
  validateChatMessage,
};
