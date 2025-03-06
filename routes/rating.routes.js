const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/rating.controller");
const {isAuthenticated, isUserOrAdmin } = require("../middleware/jwt.middleware");


router.post("/games/:gameId/ratings", isAuthenticated,ratingController.createOrUpdateRating);
router.get("/games/:gameId/ratings", ratingController.getGameRatings);
router.get("/games/:gameId/ratings/stats", ratingController.getGameRatingStats);
router.get("/games/:gameId/my-rating", isAuthenticated, ratingController.getUserGameRating);
router.get("/users/ratings", isAuthenticated, ratingController.getUserRatings); // show me my ratings
router.get("/users/:userId/ratings", isAuthenticated, isUserOrAdmin, ratingController.getUserRatings); // show me the ratings of the user with ID x
router.delete("/ratings/:ratingId", isAuthenticated, ratingController.deleteRating);

module.exports = router;
