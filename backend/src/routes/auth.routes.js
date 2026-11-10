const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/auth.controller");
const { protect, optionalAuth } = require("../middlewares/auth");

const strict = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: "Trop de tentatives, réessaie dans quelques minutes" },
});

router.post("/register", strict, ctrl.register);
router.post("/login", strict, ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me", protect, ctrl.me);
router.get("/session", optionalAuth, ctrl.session);

router.post("/forgot-password", strict, ctrl.forgotPassword);
router.post("/verify-otp", strict, ctrl.verifyOtp);
router.post("/reset-password", strict, ctrl.resetPassword);

module.exports = router;
