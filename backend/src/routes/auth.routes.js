const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { protect, optionalAuth } = require("../middlewares/auth");
const { limiter, perAccount } = require("../middlewares/rateLimit");

const failedOnly = { skipSuccessfulRequests: true };

router.post("/register", limiter(10), ctrl.register);
router.post("/login", limiter(10, failedOnly), perAccount("identifier", 10, failedOnly), ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me", protect, ctrl.me);
router.get("/session", optionalAuth, ctrl.session);

router.post("/forgot-password", limiter(5), perAccount("email", 3), ctrl.forgotPassword);
router.post("/verify-otp", limiter(10), ctrl.verifyOtp);
router.post("/reset-password", limiter(10), ctrl.resetPassword);

module.exports = router;
