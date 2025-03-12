const cors = require("cors");

const corsMiddleware = cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5005",
    "https://playwith-fulp-ironhack-2025.netlify.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

module.exports = corsMiddleware;