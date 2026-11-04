const express = require("express");
const {
  handleRegister,
  handleLogin,
  getCurrentUser,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", handleRegister);
router.post("/signup", handleRegister);
router.post("/login", handleLogin);
router.post("/signin", handleLogin);
router.get("/me", getCurrentUser);

module.exports = router;
