const cors = require("cors");

const corsMiddleware = cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5005",
    "http://mydomain.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

module.exports = corsMiddleware;