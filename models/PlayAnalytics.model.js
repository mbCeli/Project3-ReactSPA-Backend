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
      required: true,
    },

    userAction: {
      type: String,
      enum: ["play", "favorite", "unfavorite", "view"],
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

analyticsSchema.index({ user: 1, game: 1, playDate: 1 }); // this is for play history, is an index that will be used to find the play history of a user
analyticsSchema.index({ game: 1, score: -1 }); // for leaderboards in descending order for highest scores for each game

const Analytics = mongoose.model("Analytics", analyticsSchema);
module.exports = Analytics;
