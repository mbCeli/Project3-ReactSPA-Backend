const mongoose = require("mongoose");

require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB`);
  })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });
