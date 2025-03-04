const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gameSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    creator: {
      type: String,
      required: true,
    },

    gameUrl: {
      type: String,
      required: true,
      unique: true,
    },

    thumbnail: {
      type: String,
      default: "/default-game-thumbnail.png",
    },

    category: {
      type: String,
      enum: ["Puzzle", "Strategy", "Arcade", "Adventure", "Educational"],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    popularity: {
      type: Number,
      default: 0,
    },

    rating: {
      averageScore: {
        type: Number,
        default: 0,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
    },

    totalPlays: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
  }
);

const Game = mongoose.model("Game", gameSchema);
module.exports = Game;