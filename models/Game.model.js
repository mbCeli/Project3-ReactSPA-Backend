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
    creatorGithub: {
      type: String,
      trim: true,
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
    // New fields for achievements
    achievements: [
      {
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        criteria: {
          type: String, // Description of how to earn it
          required: true,
        },
        iconUrl: {
          type: String,
          default: "/default-achievement-icon.png",
        },
      },
    ],
    // New field for counting favorites
    favoriteCount: {
      type: Number,
      default: 0,
    },
    // Date when the game was added
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// indexes for common queries
gameSchema.index({ category: 1, popularity: -1 }); // For finding popular games by category
gameSchema.index({ difficulty: 1 }); // For filtering by difficulty
gameSchema.index({ "rating.averageScore": -1 }); // For sorting by rating
gameSchema.index({ totalPlays: -1 }); // For finding most played games

const Game = mongoose.model("Game", gameSchema);
module.exports = Game;
