const mongoose = require("mongoose");

const state = {
  isDbConnected: false,
  memoryUsers: [],
  memoryWishlist: [],
};

mongoose
  .connect("mongodb://localhost:27017/second_hand_books")
  .then(() => {
    state.isDbConnected = true;
    console.log("MongoDB connected successfully!");
  })
  .catch(() => {
    console.log("MongoDB is offline. Running in simple in-memory mode.");
  });

module.exports = state;
