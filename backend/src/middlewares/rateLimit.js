const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { text } = require("../utils/input");

const MESSAGE = { message: "Trop de tentatives, réessaie dans quelques minutes" };

const disabled = () => process.env.NODE_ENV === "test" && process.env.RATE_LIMIT !== "on";

function limiter(limit, options = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    skip: disabled,
    message: MESSAGE,
    ...options,
  });
}

function perAccount(field, limit, options = {}) {
  return limiter(limit, {
    keyGenerator: (req) => `${field}:${text(req.body[field]).toLowerCase() || ipKeyGenerator(req.ip)}`,
    ...options,
  });
}

const apiLimiter = limiter(1000);

module.exports = { limiter, perAccount, apiLimiter };
