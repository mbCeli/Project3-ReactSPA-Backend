const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const analyticsSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    playDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    playDuration: {
      type: Number, // Duration in seconds
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "tablet", "mobile"],
    },
    userAction: {
      type: String,
      enum: ["play", "favorite", "unfavorite", "view"],
      required: true,
    },
    // New fields for tracking achievements and levels
    achievementsEarned: [
      {
        achievement: {
          type: String, // Name of the achievement
          required: true,
        },
        earnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    level: {
      type: Number,
      default: 1,
    },
    
    levelCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// indexes for common queries
analyticsSchema.index({ user: 1, game: 1, playDate: 1 });
analyticsSchema.index({ game: 1, score: -1 });
analyticsSchema.index({ user: 1, playDate: -1 }); // For user's play history
analyticsSchema.index({ game: 1, playDate: -1 }); // For game activity timeline
analyticsSchema.index({ user: 1, userAction: 1 }); // For tracking user behaviors

const PlayAnalytics = mongoose.model("PlayAnalytics", analyticsSchema);
module.exports = PlayAnalytics;
