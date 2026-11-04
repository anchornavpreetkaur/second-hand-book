const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/environment");

function getAuthUser(req) {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      return jwt.verify(header.split(" ")[1], JWT_SECRET);
    }
  } catch (err) {}
  return null;
}

module.exports = { getAuthUser };
