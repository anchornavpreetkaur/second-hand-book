const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "book_store_secret_2026",
  GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY || "",
  BOOKSRUN_API_KEY: process.env.BOOKSRUN_API_KEY || "",
};
