const router = require("express").Router();
const ctrl = require("../controllers/post.controller");
const comments = require("../controllers/comment.controller");
const upload = require("../middlewares/upload");
const { protect, optionalAuth, allowRoles } = require("../middlewares/auth");

router.get("/categories", ctrl.listCategories);
router.get("/", optionalAuth, ctrl.listPosts);
router.get("/:id", optionalAuth, ctrl.getPost);

router.post("/", protect, allowRoles("author", "admin"), upload.single("image"), ctrl.createPost);
router.patch("/:id", protect, upload.single("image"), ctrl.updatePost);
router.delete("/:id", protect, ctrl.deletePost);

router.post("/:id/like", protect, ctrl.likePost);
router.post("/:id/save", protect, ctrl.savePost);

router.get("/:id/comments", optionalAuth, comments.listComments);
router.post("/:id/comments", protect, comments.addComment);

module.exports = router;
