const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { protect, optionalAuth } = require("../middlewares/auth");
const { limiter, perAccount } = require("../middlewares/rateLimit");
const { turnstile } = require("../middlewares/turnstile");

const failedOnly = { skipSuccessfulRequests: true };

// Le contrôle anti-robot passe avant les limites par compte : un robot sans jeton
// ne peut pas épuiser le quota d'un compte qui n'est pas le sien.
router.post("/register", limiter(10), turnstile("signup"), ctrl.register);
router.post(
  "/login",
  limiter(10, failedOnly),
  turnstile("login"),
  perAccount("identifier", 10, failedOnly),
  ctrl.login
);
router.post("/logout", ctrl.logout);
router.get("/me", protect, ctrl.me);
router.get("/session", optionalAuth, ctrl.session);

router.post(
  "/forgot-password",
  limiter(5),
  turnstile("forgot-password"),
  perAccount("email", 3),
  ctrl.forgotPassword
);
router.post("/verify-otp", limiter(10), ctrl.verifyOtp);
router.post("/reset-password", limiter(10), ctrl.resetPassword);

module.exports = router;
