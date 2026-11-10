const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/auth.controller");
const { protect, optionalAuth } = require("../middlewares/auth");

const limiter = (limit) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    message: { message: "Trop de tentatives, réessaie dans quelques minutes" },
  });

router.post("/register", limiter(10), ctrl.register);
router.post("/login", limiter(20), ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me", protect, ctrl.me);
router.get("/session", optionalAuth, ctrl.session);

router.post("/forgot-password", limiter(5), ctrl.forgotPassword);
router.post("/verify-otp", limiter(10), ctrl.verifyOtp);
router.post("/reset-password", limiter(10), ctrl.resetPassword);

module.exports = router;
