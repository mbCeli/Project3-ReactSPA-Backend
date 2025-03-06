const PlayAnalytics = require("../models/PlayAnalytics.model");
const Game = require("../models/Game.model");
const User = require("../models/User.model");

// Record a new play session
const recordPlaySession = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.payload._id; // From JWT token

    const {
      score = 0,
      playDuration = 0,
      completed = false,
      deviceType = "desktop",
      level = 1,
      levelCompleted = false,
      achievementsEarned = [],
    } = req.body;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Create play analytics record
    const playSession = await PlayAnalytics.create({
      user: userId,
      game: gameId,
      score,
      playDuration,
      completed,
      deviceType,
      userAction: "play",
      level,
      levelCompleted,
      achievementsEarned,
    });

    // Update game play count
    await Game.findByIdAndUpdate(gameId, {
      $inc: { totalPlays: 1 },
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: {
        "stats.totalPlayTime": playDuration,
        "stats.gamesPlayed": 1,
      },
      $max: { "stats.highestScore": score },
      $set: { "stats.lastActive": new Date() },
    });

    console.log(
      `Play session recorded for game ${game.title} by user ${userId}`
    );
    res.status(201).json(playSession);
  } catch (err) {
    console.error("Error recording play session:", err);
    res.status(500).json({
      message: "Failed to record play session",
      error: err.message,
    });
  }
};

// Get user's play history
const getUserPlayHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.payload._id;

    // Check if requesting user is allowed to access this data
    if (
      req.params.userId &&
      req.params.userId !== req.payload._id &&
      !req.payload.isAdmin
    ) {
      return res.status(403).json({
        message: "Not authorized to access another user's play history",
      });
    }

    const playHistory = await PlayAnalytics.find({
      user: userId,
      userAction: "play",
    })
      .sort({ playDate: -1 })
      .populate("game", "title thumbnail category difficulty");

    res.status(200).json(playHistory);
  } catch (err) {
    console.error("Error retrieving play history:", err);
    res.status(500).json({
      message: "Failed to retrieve play history",
      error: err.message,
    });
  }
};

// Get game play analytics
const getGameAnalytics = async (req, res) => {
  try {
    const { gameId } = req.params;

    // Check if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Get total plays
    const totalPlays = await PlayAnalytics.countDocuments({
      game: gameId,
      userAction: "play",
    });

    // Get average play duration
    const durationStats = await PlayAnalytics.aggregate([
      { $match: { game: mongoose.Types.ObjectId(gameId), userAction: "play" } },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$playDuration" },
          maxDuration: { $max: "$playDuration" },
          totalDuration: { $sum: "$playDuration" },
        },
      },
    ]);

    // Get completion rate
    const completionStats = await PlayAnalytics.aggregate([
      { $match: { game: mongoose.Types.ObjectId(gameId), userAction: "play" } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] },
          },
        },
      },
    ]);

    // Get device type distribution
    const deviceStats = await PlayAnalytics.aggregate([
      { $match: { game: mongoose.Types.ObjectId(gameId), userAction: "play" } },
      {
        $group: {
          _id: "$deviceType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Format the results
    const analytics = {
      game: {
        id: game._id,
        title: game.title,
      },
      totalPlays,
      playDuration:
        durationStats.length > 0
          ? {
              average: Math.round(durationStats[0].avgDuration || 0),
              max: durationStats[0].maxDuration || 0,
              total: durationStats[0].totalDuration || 0,
            }
          : { average: 0, max: 0, total: 0 },
      completionRate:
        completionStats.length > 0
          ? Math.round(
              (completionStats[0].completedSessions /
                completionStats[0].totalSessions) *
                100
            )
          : 0,
      deviceTypes: deviceStats.map((item) => ({
        type: item._id,
        count: item.count,
        percentage: Math.round((item.count / totalPlays) * 100),
      })),
    };

    res.status(200).json(analytics);
  } catch (err) {
    console.error("Error retrieving game analytics:", err);
    res.status(500).json({
      message: "Failed to retrieve game analytics",
      error: err.message,
    });
  }
};

// Record user actions (favorite, unfavorite, view)
const recordUserAction = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.payload._id;
    const { userAction, deviceType = "desktop" } = req.body;

    // Validate action type
    if (!["favorite", "unfavorite", "view"].includes(userAction)) {
      return res.status(400).json({ message: "Invalid action type" });
    }

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Record the action
    const actionRecord = await PlayAnalytics.create({
      user: userId,
      game: gameId,
      deviceType,
      userAction,
      playDate: new Date(),
    });

    // Update favorite count if applicable
    if (userAction === "favorite") {
      await Game.findByIdAndUpdate(gameId, { $inc: { favoriteCount: 1 } });
      await User.findByIdAndUpdate(userId, {
        $addToSet: { favourites: gameId },
      });
    } else if (userAction === "unfavorite") {
      await Game.findByIdAndUpdate(gameId, { $inc: { favoriteCount: -1 } });
      await User.findByIdAndUpdate(userId, { $pull: { favourites: gameId } });
    }

    // Update user last active time
    await User.findByIdAndUpdate(userId, {
      $set: { "stats.lastActive": new Date() },
    });

    console.log(
      `User ${userId} performed action ${userAction} on game ${game.title}`
    );
    res.status(201).json(actionRecord);
  } catch (err) {
    console.error("Error recording user action:", err);
    res.status(500).json({
      message: "Failed to record user action",
      error: err.message,
    });
  }
};

// Get user achievements
const getUserAchievements = async (req, res) => {
  try {
    const userId = req.params.userId || req.payload._id;

    // Check if requesting user is allowed to access this data
    if (
      req.params.userId &&
      req.params.userId !== req.payload._id &&
      !req.payload.isAdmin
    ) {
      return res.status(403).json({
        message: "Not authorized to access another user's achievements",
      });
    }

    const achievements = await PlayAnalytics.find({
      user: userId,
      achievementsEarned: { $exists: true, $ne: [] },
    })
      .select("game achievementsEarned playDate")
      .populate("game", "title thumbnail")
      .sort({ playDate: -1 });

    // Group achievements by game
    const achievementsByGame = {};
    achievements.forEach((record) => {
      const gameId = record.game._id.toString();

      if (!achievementsByGame[gameId]) {
        achievementsByGame[gameId] = {
          game: record.game,
          achievements: [],
        };
      }

      record.achievementsEarned.forEach((achievement) => {
        // Check if this achievement is already recorded
        const existingAchievement = achievementsByGame[
          gameId
        ].achievements.find((a) => a.achievement === achievement.achievement);

        if (!existingAchievement) {
          achievementsByGame[gameId].achievements.push(achievement);
        }
      });
    });

    res.status(200).json(Object.values(achievementsByGame));
  } catch (err) {
    console.error("Error retrieving user achievements:", err);
    res.status(500).json({
      message: "Failed to retrieve user achievements",
      error: err.message,
    });
  }
};

// Get platform-wide analytics (admin only)
const getPlatformAnalytics = async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.payload.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const timeRange = req.query.timeRange || 30; // Default to last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Total plays in time period
    const totalPlays = await PlayAnalytics.countDocuments({
      userAction: "play",
      playDate: { $gte: startDate },
    });

    // Total users who played games
    const activeUsers = await PlayAnalytics.distinct("user", {
      userAction: "play",
      playDate: { $gte: startDate },
    });

    // Most popular games
    const popularGames = await PlayAnalytics.aggregate([
      { $match: { userAction: "play", playDate: { $gte: startDate } } },
      {
        $group: {
          _id: "$game",
          playCount: { $sum: 1 },
        },
      },
      { $sort: { playCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "games",
          localField: "_id",
          foreignField: "_id",
          as: "gameDetails",
        },
      },
      { $unwind: "$gameDetails" },
      {
        $project: {
          _id: 0,
          gameId: "$_id",
          title: "$gameDetails.title",
          category: "$gameDetails.category",
          playCount: 1,
        },
      },
    ]);

    // Activity by day
    const dailyActivity = await PlayAnalytics.aggregate([
      { $match: { playDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$playDate" },
          },
          plays: {
            $sum: { $cond: [{ $eq: ["$userAction", "play"] }, 1, 0] },
          },
          favorites: {
            $sum: { $cond: [{ $eq: ["$userAction", "favorite"] }, 1, 0] },
          },
          unfavorites: {
            $sum: { $cond: [{ $eq: ["$userAction", "unfavorite"] }, 1, 0] },
          },
          views: {
            $sum: { $cond: [{ $eq: ["$userAction", "view"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format results
    const analytics = {
      timeRange: parseInt(timeRange),
      totalPlays,
      activeUsers: activeUsers.length,
      popularGames,
      dailyActivity,
      averageDailyPlays: Math.round(totalPlays / dailyActivity.length) || 0,
    };

    res.status(200).json(analytics);
  } catch (err) {
    console.error("Error retrieving platform analytics:", err);
    res.status(500).json({
      message: "Failed to retrieve platform analytics",
      error: err.message,
    });
  }
};

module.exports = {
  recordPlaySession,
  getUserPlayHistory,
  getGameAnalytics,
  recordUserAction,
  getUserAchievements,
  getPlatformAnalytics,
};
