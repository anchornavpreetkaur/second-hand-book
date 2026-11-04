const express = require("express");
const {
  getWishlist,
  addWishlistItem,
  deleteWishlistItem,
  clearWishlist,
} = require("../controllers/wishlistController");

const router = express.Router();

router.get("/", getWishlist);
router.post("/", addWishlistItem);
router.delete("/:id", deleteWishlistItem);
router.delete("/", clearWishlist);

module.exports = router;
