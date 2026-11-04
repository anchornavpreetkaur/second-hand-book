const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Wishlist",
  new mongoose.Schema({
    userId: { type: String, required: true },
    bookId: { type: String, default: "" },
    title: { type: String, required: true },
    author: { type: String, default: "Unknown Author" },
    price: { type: Number, default: 0 },
    priceFormatted: { type: String, default: "$0.00" },
    website: { type: String, default: "" },
    condition: { type: String, default: "Used" },
    coverImage: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
  }),
);
