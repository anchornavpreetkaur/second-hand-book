const express = require("express");
const { compareBooks, searchBooks } = require("../controllers/bookController");

const router = express.Router();

router.get("/compare", compareBooks);
router.get("/search", searchBooks);

module.exports = router;
