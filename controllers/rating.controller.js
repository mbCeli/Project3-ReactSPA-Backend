const Rating = require("../models/Rating.model");
const Game = require("../models/Game.model");
const User = require("../models/User.model");
const mongoose = require("mongoose");

// Create or update a rating
const createOrUpdateRating = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.payload._id;
    const { score, comments } = req.body; // I only want the score and the comments

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // checks if score is within range
    if (score < 1 || score > 5) {
      return res.status(400).json({ message: "Score must be between 1 and 5" });
    }

    // Check if user has already rated this game
    const existingRating = await Rating.findOne({ user: userId, game: gameId });

    let rating;
    let operation;

    if (existingRating) {
      // Update existing rating
      rating = await Rating.findByIdAndUpdate(
        existingRating._id,
        { score, comments },
        { new: true }
      );
      operation = "updated";
    } else {
      // Create new rating
      rating = await Rating.create({
        user: userId,
        game: gameId,
        score,
        comments,
      });
      operation = "created";
    }

    // Update game's average rating (function created below)
    await updateGameAverageRating(gameId);

    res.status(operation === "created" ? 201 : 200).json(rating);
  } catch (err) {
    console.error("Error creating/updating rating:", err);
    res.status(500).json({
      message: "Failed to create/update rating",
      error: err.message,
    });
  }
};

// Get all ratings for one game
const getGameRatings = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { sort = "newest" } = req.query;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Determine sort order
    let sortOption = { createdAt: -1 }; // Default to newest first

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "highest") {
      sortOption = { score: -1 };
    } else if (sort === "lowest") {
      sortOption = { score: 1 };
    }

    // Get ratings with user info
    const ratings = await Rating.find({ game: gameId })
      .sort(sortOption)
      .populate("user", "username fullName");

    res.status(200).json(ratings);
  } catch (err) {
    console.error("Error retrieving game ratings:", err);
    res.status(500).json({
      message: "Failed to retrieve game ratings",
      error: err.message,
    });
  }
};

// Get a user's rating for a specific game
const getUserGameRating = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.payload._id;

    const rating = await Rating.findOne({ user: userId, game: gameId });

    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    res.status(200).json(rating);
  } catch (err) {
    console.error("Error retrieving user's game rating:", err);
    res.status(500).json({
      message: "Failed to retrieve user's game rating",
      error: err.message,
    });
  }
};

// Get all ratings by a user
const getUserRatings = async (req, res) => {
  try {
    const userId = req.params.userId || req.payload._id;

    // Check if requesting user is allowed to access this data
    if (
      req.params.userId &&
      req.params.userId !== req.payload._id &&
      !req.payload.isAdmin
    ) {
      return res.status(403).json({
        message: "Not authorized to access another user's ratings",
      });
    }

    const ratings = await Rating.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("game", "title thumbnail category");

    res.status(200).json(ratings);
  } catch (err) {
    console.error("Error retrieving user ratings:", err);
    res.status(500).json({
      message: "Failed to retrieve user ratings",
      error: err.message,
    });
  }
};

// Delete a rating
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const userId = req.payload._id;

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    // Check if user is authorized to delete this rating
    if (rating.user.toString() !== userId && !req.payload.isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this rating" });
    }

    // Delete the rating
    await Rating.findByIdAndDelete(ratingId);

    // Update game's average rating
    await updateGameAverageRating(rating.game);

    (`Rating deleted for game ${rating.game} by user ${userId}`);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting rating:", err);
    res.status(500).json({
      message: "Failed to delete rating",
      error: err.message,
    });
  }
};

// Get rating statistics for a game
const getGameRatingStats = async (req, res) => {
  try {
    const { gameId } = req.params;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Get rating distribution
    const ratingDistribution = await Rating.aggregate([
      { $match: { game: new mongoose.Types.ObjectId(gameId) } },
      {
        $group: {
          _id: "$score",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Create a complete distribution with all scores 1-5
    const distribution = {};
    for (let i = 1; i <= 5; i++) {
      distribution[i] = 0;
    }

    ratingDistribution.forEach((item) => {
      distribution[item._id] = item.count;
    });

    // Get total ratings and calculate percentages
    const totalRatings = Object.values(distribution).reduce((a, b) => a + b, 0);

    const stats = {
      averageScore: game.rating.averageScore,
      totalRatings,
      distribution: Object.entries(distribution).map(([score, count]) => ({
        score: parseInt(score),
        count,
        percentage:
          totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0,
      })),
    };

    res.status(200).json(stats);
  } catch (err) {
    console.error("Error retrieving game rating stats:", err);
    res.status(500).json({
      message: "Failed to retrieve game rating stats",
      error: err.message,
    });
  }
};

// Helper function to update a game's average rating
const updateGameAverageRating = async (gameId) => {
  try {
    // Calculate new average rating
    const ratingStats = await Rating.aggregate([
      { $match: { game: new mongoose.Types.ObjectId(gameId) } }, // to coincide with the game id
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$score" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    // Update game with new rating data
    if (ratingStats.length > 0) {
      await Game.findByIdAndUpdate(
        gameId,
        {
          "rating.averageScore":
            Math.round(ratingStats[0].averageScore * 10) / 10, // Round to 1 decimal
          "rating.totalRatings": ratingStats[0].totalRatings,
        },
        { new: true }
      );
    } else {
      // No ratings left
      await Game.findByIdAndUpdate(gameId, {
        "rating.averageScore": 0,
        "rating.totalRatings": 0,
      });
    }
  } catch (error) {
    console.error("Error updating game average rating:", error);
    throw error;
  }
};

module.exports = {
  createOrUpdateRating,
  getGameRatings,
  getUserGameRating,
  getUserRatings,
  deleteRating,
  getGameRatingStats,
};
