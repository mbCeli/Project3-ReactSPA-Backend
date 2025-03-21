const mongoose = require("mongoose");

require("dotenv").config();

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/games-app";
mongoose
  .connect(MONGO_URI)
  .then((x) => {
    const dbName = x.connections[0].name;
  })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });
