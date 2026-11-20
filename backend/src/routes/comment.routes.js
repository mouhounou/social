const router = require("express").Router();
const { deleteComment, listReplies } = require("../controllers/comment.controller");
const { protect, optionalAuth } = require("../middlewares/auth");

router.get("/:id/replies", optionalAuth, listReplies);
router.delete("/:id", protect, deleteComment);

module.exports = router;
