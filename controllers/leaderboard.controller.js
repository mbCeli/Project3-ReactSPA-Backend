const Leaderboard = require("../models/Leaderboard.model");
const Game = require("../models/Game.model");
const User = require("../models/User.model");
const mongoose = require("mongoose");

// Submit a new score to the leaderboard
const postScore = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.payload._id;
    const { score, timeframe = "allTime" } = req.body;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // check that the score is a positive number
    if (!score || typeof score !== "number") {
      return res
        .status(400)
        .json({ message: "Score must be a positive number" });
    } else if (score < 0) {
      score = 0;
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // if there is no leaderboard, create one
    let leaderboard = await Leaderboard.findOne({ game: gameId, timeframe });

    if (!leaderboard) {
      leaderboard = await Leaderboard.create({
        game: gameId,
        timeframe,
        entries: [],
      });
    }

    // Check if user already has an entry
    const existingEntryIndex = leaderboard.entries.findIndex(
      (entry) => entry.user.toString() === userId
    );

    // if there is no user leaderboard entry, add one, if there is, update it
    if (existingEntryIndex !== -1) {
      //update if new score is higher
      if (score > leaderboard.entries[existingEntryIndex].score) {
        leaderboard.entries[existingEntryIndex].score = score;
        leaderboard.entries[existingEntryIndex].achievedAt = new Date();
      } else {
        return res.status(200).json({
          message: "Existing score is higher, leaderboard not updated",
          leaderboard,
        });
      }
    } else {
      // add new
      leaderboard.entries.push({
        user: userId,
        username: user.username,
        score,
        achievedAt: new Date(),
      });
    }

    // Update lastUpdated timestamp
    leaderboard.lastUpdated = new Date();

    // Sort entries by score (descending)
    leaderboard.entries.sort((a, b) => b.score - a.score);

    // Save changes
    await leaderboard.save();

    // Update user's highest score if needed
    if (score > user.stats.highestScore) {
      await User.findByIdAndUpdate(userId, {
        "stats.highestScore": score,
        "stats.lastActive": new Date(),
      });
    }
    res.status(201).json(leaderboard);
  } catch (err) {
    console.error("Error submitting score:", err);
    res.status(500).json({
      message: "Failed to submit score",
      error: err.message,
    });
  }
};

// GET leaderboard for a game
const getLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { timeframe = "allTime", limit = 10 } = req.query;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Find leaderboard
    const leaderboard = await Leaderboard.findOne({ game: gameId, timeframe });

    if (!leaderboard) {
      return res.status(200).json({
        game: {
          id: game._id,
          title: game.title,
          thumbnail: game.thumbnail,
          category: game.category,
        },
        timeframe,
        entries: [],
      });
    }

    // Get user rank if authenticated
    let userRank = null;
    if (req.payload) {
      const userId = req.payload._id;
      const userEntryIndex = leaderboard.entries.findIndex(
        (entry) => entry.user.toString() === userId
      );

      if (userEntryIndex !== -1) {
        userRank = {
          position: userEntryIndex + 1,
          score: leaderboard.entries[userEntryIndex].score,
          achievedAt: leaderboard.entries[userEntryIndex].achievedAt,
        };
      }
    }

    // Format response
    const result = {
      game: leaderboard.game,
      timeframe,
      lastUpdated: leaderboard.lastUpdated,
      entries: leaderboard.entries.slice(0, parseInt(limit)),
      totalEntries: leaderboard.entries.length,
      userRank,
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Error retrieving leaderboard:", err);
    res.status(500).json({
      message: "Failed to retrieve leaderboard",
      error: err.message,
    });
  }
};

// GET user's rank across all leaderboards
const getUserRanks = async (req, res) => {
  try {
    const userId = req.params.userId || req.payload._id;

    // Check if requesting user is allowed to access this data
    if (
      req.params.userId &&
      req.params.userId !== req.payload._id &&
      !req.payload.isAdmin
    ) {
      return res.status(403).json({
        message: "Not authorized to access another user's ranks",
      });
    }

    // Find all leaderboards where user has an entry
    const leaderboards = await Leaderboard.find({
      "entries.user": userId,
    }).populate("game", "title thumbnail category");

    if (leaderboards.length === 0) {
      return res.status(200).json([]);
    }

    // Format user ranks data
    const userRanks = leaderboards.map((leaderboard) => {
      const entryIndex = leaderboard.entries.findIndex(
        (entry) => entry.user.toString() === userId
      );

      return {
        game: leaderboard.game,
        timeframe: leaderboard.timeframe,
        rank: entryIndex + 1,
        score: leaderboard.entries[entryIndex].score,
        achievedAt: leaderboard.entries[entryIndex].achievedAt,
        totalPlayers: leaderboard.entries.length,
      };
    });

    // Sort by rank (best rankings first)
    userRanks.sort((a, b) => {
      // Calculate percentile rank (lower is better) - no idea what this does
      const rankPercentileA = a.rank / a.totalPlayers;
      const rankPercentileB = b.rank / b.totalPlayers;
      return rankPercentileA - rankPercentileB;
    });

    res.status(200).json(userRanks);
  } catch (err) {
    console.error("Error retrieving user ranks:", err);
    res.status(500).json({
      message: "Failed to retrieve user ranks",
      error: err.message,
    });
  }
};

// Reset a leaderboard
const resetLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { timeframe = "allTime" } = req.query;

    // Check if user is admin
    if (!req.payload.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Find and update the leaderboard
    const leaderboard = await Leaderboard.findOneAndUpdate(
      { game: gameId, timeframe },
      {
        entries: [],
        lastUpdated: new Date(),
      },
      { new: true }
    );

    if (!leaderboard) {
      return res.status(404).json({ message: "Leaderboard not found" });
    }

    res.status(200).json({ message: "Leaderboard reset successfully" });
  } catch (err) {
    console.error("Error resetting leaderboard:", err);
    res.status(500).json({
      message: "Failed to reset leaderboard",
      error: err.message,
    });
  }
};

// GET global rankings across all games (top players)
const getGlobalRankings = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Aggregate to find users with highest total scores across all leaderboards
    const globalRankings = await Leaderboard.aggregate([
      // Unwind entries to get individual records
      { $unwind: "$entries" },

      // Group by user to sum scores
      {
        $group: {
          _id: "$entries.user",
          username: { $first: "$entries.username" },
          totalScore: { $sum: "$entries.score" },
          gamesRanked: { $addToSet: "$game" },
          highestScore: { $max: "$entries.score" },
        },
      },

      // Sort by total score
      { $sort: { totalScore: -1 } },

      // Limit results
      { $limit: parseInt(limit) },

      // Project final fields
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: 1,
          rank: 1,
          totalScore: 1,
          gamesRanked: { $size: "$gamesRanked" },
          highestScore: 1,
        },
      },
    ]);

    // Get additional user info
    const rankings = await Promise.all(
      globalRankings.map(async (rank, index) => {
        const user = await User.findById(rank.userId, "username fullName");
        return {
          ...rank,
          rank: index + 1, // Set rank based on position in sorted array
          fullName: user ? user.fullName : "Unknown",
        };
      })
    );

    res.status(200).json(rankings);
  } catch (err) {
    console.error("Error retrieving global rankings:", err);
    res.status(500).json({
      message: "Failed to retrieve global rankings",
      error: err.message,
    });
  }
};

// Delete a user from leaderboard
const deleteUserFromLeaderboard = async (req, res) => {
  try {
    const { gameId, userId } = req.params;
    const { timeframe = "allTime" } = req.query;

    if (!req.payload.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Find the leaderboard
    const leaderboard = await Leaderboard.findOne({ game: gameId, timeframe });

    if (!leaderboard) {
      return res.status(404).json({ message: "Leaderboard not found" });
    }

    // Remove user entries
    const initialLength = leaderboard.entries.length;
    leaderboard.entries = leaderboard.entries.filter(
      (entry) => entry.user.toString() !== userId
    );

    // If no entries were removed
    if (initialLength === leaderboard.entries.length) {
      return res.status(404).json({ message: "User not found in leaderboard" });
    }

    // Update lastUpdated timestamp
    leaderboard.lastUpdated = new Date();

    // Save changes
    await leaderboard.save();
    res
      .status(200)
      .json({ message: "User removed from leaderboard successfully" });
  } catch (err) {
    console.error("Error removing user from leaderboard:", err);
    res.status(500).json({
      message: "Failed to remove user from leaderboard",
      error: err.message,
    });
  }
};

module.exports = {
  postScore,
  getLeaderboard,
  getUserRanks,
  resetLeaderboard,
  getGlobalRankings,
  deleteUserFromLeaderboard,
};
