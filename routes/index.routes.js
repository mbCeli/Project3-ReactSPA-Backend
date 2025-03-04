const express = require("express");
const router = express.Router();

const userRoutes = require("./user.routes");
const gameRoutes = require("./game.routes");
const playAnalyticsRoutes = require("./playAnalytics.routes");

router.use("/users", userRoutes);
router.use("/games", gameRoutes);
router.use("/analytics", playAnalyticsRoutes);

module.exports = router;
