const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const { text } = require("../utils/input");
const { findVisiblePost } = require("../utils/postAccess");

function serialize(c) {
  return {
    _id: c._id,
    content: c.content,
    post: c.post,
    createdAt: c.createdAt,
    author: c.author && {
      _id: c.author._id,
      name: c.author.name,
      username: c.author.username,
      avatar: c.author.avatar?.url || null,
    },
  };
}

async function listComments(req, res) {
  const post = await findVisiblePost(req.params.id, req.user);
  const comments = await Comment.find({ post: post._id })
    .sort({ createdAt: 1 })
    .populate("author", "name username avatar");
  res.json({ comments: comments.map(serialize) });
}

async function addComment(req, res) {
  const content = text(req.body.content);
  if (!content) throw new AppError("Le commentaire est vide");

  const post = await findVisiblePost(req.params.id, req.user);

  const comment = await Comment.create({ post: post._id, author: req.user._id, content });
  await Post.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });
  await Notification.push({ recipient: post.author, actor: req.user._id, type: "comment", post: post._id });

  await comment.populate("author", "name username avatar");
  res.status(201).json({ comment: serialize(comment) });
}

async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.id).populate("post", "author");
  if (!comment) throw new AppError("Commentaire introuvable", 404);

  const uid = req.user._id;
  const allowed =
    comment.author.equals(uid) || comment.post?.author.equals(uid) || req.user.role === "admin";
  if (!allowed) throw new AppError("Action non autorisée", 403);

  await comment.deleteOne();
  if (comment.post) {
    await Post.updateOne({ _id: comment.post._id, commentsCount: { $gt: 0 } }, { $inc: { commentsCount: -1 } });
  }

  res.json({ message: "Commentaire supprimé" });
}

module.exports = { listComments, addComment, deleteComment };
