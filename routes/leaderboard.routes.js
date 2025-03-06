const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboard.controller");
const {isAuthenticated, isAdmin, isUserOrAdmin,} = require("../middleware/jwt.middleware");


router.post("/games/:gameId/leaderboard", isAuthenticated, leaderboardController.postScore);
router.get("/games/:gameId/leaderboard", leaderboardController.getLeaderboard);
router.get("/users/ranks", isAuthenticated, leaderboardController.getUserRanks);
router.get("/users/:userId/ranks", isAuthenticated, isUserOrAdmin, leaderboardController.getUserRanks);
router.get("/global", leaderboardController.getGlobalRankings);
router.delete("/games/:gameId/leaderboard", isAuthenticated, isAdmin, leaderboardController.resetLeaderboard);
router.delete("/games/:gameId/leaderboard/:userId", isAuthenticated, isAdmin, leaderboardController.deleteUserFromLeaderboard);

module.exports = router;
