const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ratingSchema = new Schema(
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
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comments: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// to ensure a user can only rate a game once
ratingSchema.index({ user: 1, game: 1 }, { unique: true });
// to find all ratings for a game
ratingSchema.index({ game: 1, createdAt: -1 });
// to find all ratings by a user
ratingSchema.index({ user: 1, createdAt: -1 });

const Rating = mongoose.model("Rating", ratingSchema);
module.exports = Rating;
