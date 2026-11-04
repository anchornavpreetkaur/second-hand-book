const Wishlist = require("../models/Wishlist");
const database = require("../config/database");
const { getAuthUser } = require("../middleware/authMiddleware");

async function getWishlist(req, res) {
  const user = getAuthUser(req);
  const userId = user ? user.id : req.query.userId;
  if (!userId) return res.status(401).json({ success: false, items: [] });

  const items = database.isDbConnected
    ? await Wishlist.find({ userId })
    : database.memoryWishlist.filter((i) => i.userId === userId);
  return res.json({ success: true, items });
}

async function addWishlistItem(req, res) {
  const user = getAuthUser(req);
  const userId = user ? user.id : req.body.userId;
  if (!userId)
    return res.status(401).json({ success: false, message: "Please Login" });

  const book = req.body;
  if (database.isDbConnected) {
    const item = await Wishlist.create({ ...book, userId });
    return res.json({ success: true, item });
  }

  const newItem = { ...book, userId, id: `wish-${Date.now()}` };
  database.memoryWishlist.unshift(newItem);
  return res.json({ success: true, item: newItem });
}

async function deleteWishlistItem(req, res) {
  const id = req.params.id;
  if (database.isDbConnected) {
    await Wishlist.findByIdAndDelete(id).catch(() => {});
  } else {
    database.memoryWishlist = database.memoryWishlist.filter(
      (i) => i.id !== id && i._id !== id,
    );
  }
  return res.json({ success: true });
}

async function clearWishlist(req, res) {
  const user = getAuthUser(req);
  const userId = user ? user.id : req.query.userId;
  if (database.isDbConnected) {
    await Wishlist.deleteMany({ userId });
  } else {
    database.memoryWishlist = database.memoryWishlist.filter(
      (i) => i.userId !== userId,
    );
  }
  return res.json({ success: true });
}

module.exports = {
  getWishlist,
  addWishlistItem,
  deleteWishlistItem,
  clearWishlist,
};
