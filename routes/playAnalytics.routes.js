const express = require("express");
const router = express.Router();
const playAnalyticsController = require("../controllers/playAnalytics.controller");
const { isAuthenticated, isAdmin, isUserOrAdmin } = require("../middleware/jwt.middleware");

router.post("/games/:gameId/play", isAuthenticated, playAnalyticsController.recordPlaySession);
router.post("/games/:gameId/action", isAuthenticated, playAnalyticsController.recordUserAction);
router.get("/users/history", isAuthenticated, playAnalyticsController.getUserPlayHistory);
router.get("/users/:userId/history", isAuthenticated, isUserOrAdmin, playAnalyticsController.getUserPlayHistory);
router.get("/users/achievements", isAuthenticated, playAnalyticsController.getUserAchievements);
router.get("/users/:userId/achievements", isAuthenticated, isUserOrAdmin, playAnalyticsController.getUserAchievements);
router.get("/games/:gameId/analytics", isAuthenticated, playAnalyticsController.getGameAnalytics);
router.get("/platform", isAuthenticated, isAdmin, playAnalyticsController.getPlatformAnalytics);

module.exports = router;
