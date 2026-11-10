const router = require("express").Router();
const { deleteComment } = require("../controllers/comment.controller");
const { protect } = require("../middlewares/auth");

router.delete("/:id", protect, deleteComment);

module.exports = router;
