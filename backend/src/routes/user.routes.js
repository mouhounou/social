const router = require("express").Router();
const ctrl = require("../controllers/user.controller");
const upload = require("../middlewares/upload");
const { protect, optionalAuth } = require("../middlewares/auth");

router.get("/suggestions", optionalAuth, ctrl.suggestions);
router.get("/me", protect, ctrl.myStats);
router.patch(
  "/me",
  protect,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  ctrl.updateMe
);
router.patch("/me/password", protect, ctrl.changePassword);
router.post("/:id/follow", protect, ctrl.toggleFollow);
router.get("/:username/followers", optionalAuth, ctrl.followers);
router.get("/:username/following", optionalAuth, ctrl.following);
router.get("/:username", optionalAuth, ctrl.getProfile);

module.exports = router;
