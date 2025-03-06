//CONFIGURES express server

// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
require("./db/index");
// import the models so the connect to the database
require("./models/User.model");
require("./models/PlayAnalytics.model");
require("./models/Rating.model");
require("./models/Leaderboard.model");
require("./models/Game.model");


// Handles http requests (express is node js framework)
const express = require("express");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here (this are the important routes)
//API routes
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

const gameRoutes = require("./routes/game.routes");
app.use("/api/games", gameRoutes);

const playAnalyticsRoutes = require("./routes/playAnalytics.routes");
app.use("/analytics", playAnalyticsRoutes);

const leaderboardRoutes = require("./routes/leaderboard.routes");
app.use("/leaderboard", leaderboardRoutes);

const ratingRoutes = require("./routes/rating.routes");
app.use("/", ratingRoutes); //we use this "/" because if we use /api/ratings the requests will fail 
// because the beginning of the path is different for each endpoint

//AUTHORIZATION routes
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);


module.exports = app;
