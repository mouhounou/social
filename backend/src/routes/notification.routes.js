const router = require("express").Router();
const ctrl = require("../controllers/notification.controller");
const { protect } = require("../middlewares/auth");

router.use(protect);
router.get("/", ctrl.listNotifications);
router.patch("/read", ctrl.markAllRead);

module.exports = router;
