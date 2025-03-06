const express = require("express");
const router = express.Router();

const userRoutes = require("./user.routes");
const gameRoutes = require("./game.routes");
const playAnalyticsRoutes = require("./playAnalytics.routes");
const ratingRoutes = require("./rating.routes");



router.use("/users", userRoutes);
router.use("/games", gameRoutes);
router.use("/analytics", playAnalyticsRoutes);
router.use("/", ratingRoutes); //we use this "/" because the routes in the rating.routes.js 
// are defined with paths that already start with specific resources,
// RESTful URLs that follow the convention of organizing routes by resource


module.exports = router;
