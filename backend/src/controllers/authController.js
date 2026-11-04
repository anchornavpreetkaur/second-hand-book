const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const database = require("../config/database");
const { JWT_SECRET } = require("../config/environment");
const { getAuthUser } = require("../middleware/authMiddleware");

async function handleRegister(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (database.isDbConnected) {
      const exists = await User.findOne({ email: cleanEmail });
      if (exists)
        return res
          .status(400)
          .json({ success: false, message: "Email already registered" });
      const newUser = await User.create({
        name,
        email: cleanEmail,
        password: hashedPassword,
      });
      return res.status(201).json({
        success: true,
        message: "Account created! Please log in.",
        user: { id: newUser._id, name: newUser.name, email: newUser.email },
      });
    }

    const exists = database.memoryUsers.find((u) => u.email === cleanEmail);
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    const user = {
      id: `user-${Date.now()}`,
      name,
      email: cleanEmail,
      password: hashedPassword,
    };
    database.memoryUsers.push(user);
    return res.status(201).json({
      success: true,
      message: "Account created! Please log in.",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();
    const user = database.isDbConnected
      ? await User.findOne({ email: cleanEmail })
      : database.memoryUsers.find((u) => u.email === cleanEmail);

    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id || user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    return res.json({
      success: true,
      token,
      user: { id: user._id || user.id, name: user.name, email: user.email },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

function getCurrentUser(req, res) {
  const user = getAuthUser(req);
  if (!user)
    return res.status(401).json({ success: false, message: "Not logged in" });
  return res.json({ success: true, user });
}

module.exports = { handleRegister, handleLogin, getCurrentUser };
