const express = require("express");
const router = express.Router();

const userRoutes = require("./user.routes");
const gameRoutes = require("./game.routes");
const playAnalyticsRoutes = require("./playAnalytics.routes");
const leaderboardRoutes = require("./leaderboard.routes");
const ratingRoutes = require("./rating.routes");



router.use("/users", userRoutes);
router.use("/games", gameRoutes);
router.use("/analytics", playAnalyticsRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/", ratingRoutes); //we use this "/" because if we use /api/ratings 
// the requests will fail because the beginning of the path is different for each endpoint


module.exports = router;
