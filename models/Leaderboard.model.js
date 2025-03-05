const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leaderboardSchema = new Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    timeframe: {
      type: String,
      enum: ["daily", "weekly", "monthly", "allTime"],
      default: "allTime",
      required: true,
    },
    entries: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        username: {
          type: String, // Denormalized for display without joins
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        achievedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// index for finding leaderboards by game and timeframe
leaderboardSchema.index({ game: 1, timeframe: 1 }, { unique: true });

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);
module.exports = Leaderboard;
