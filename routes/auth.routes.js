const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const {
  signup,
  login,
  verify,
  logout,
} = require("../controllers/auth.controller");

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify", isAuthenticated, verify);
router.get("/logout", isAuthenticated, logout);

module.exports = router;
