const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { COOKIE_NAME } = require("../utils/token");

function readToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[COOKIE_NAME];
}

async function loadUser(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user || user.isBlocked) return null;
    return user;
  } catch {
    return null;
  }
}

async function protect(req, res, next) {
  const user = await loadUser(req);
  if (!user) throw new AppError("Connecte-toi pour continuer", 401);
  req.user = user;
  next();
}

async function optionalAuth(req, res, next) {
  req.user = await loadUser(req);
  next();
}

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError("Tu n'as pas les droits pour faire ça", 403);
  }
  next();
};

module.exports = { protect, optionalAuth, allowRoles };
