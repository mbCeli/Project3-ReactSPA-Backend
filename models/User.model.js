const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true, //remove spaces at the beginning and at the end
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address.`,
      },
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      validate: {
        validator: function (v) {
          return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-z]).{5,}$/.test(v);
        },
        message: (props) =>
          "Password must contain at least one uppercase letter, one number, and one special character!",
      },
    },

    role: {
      type: String,
      required: true,
      enum: ["user", "admin"],
      default: "user",
    },

    ageRange: {
      type: String,
      required: true,
      enum: ["10-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
    },

    favourites: [
      {
        type: mongoose.Schema.Types.ObjectId, //relationship with the Game model
        ref: "Game",
      },
    ],

    playHistory: [
      {
        game: {
          type: mongoose.Schema.Types.ObjectId, //relationship with the Game model
          ref: "Game",
        },
        lastPlayed: {
          type: Date,
          default: Date.now,
        },
        timesPlayed: {
          type: Number,
          default: 1,
        },
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, //to prevent from being updated
    },
  },
  {
    timestamps: false,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
