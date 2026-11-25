const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const { text } = require("../utils/input");
const { findVisiblePost } = require("../utils/postAccess");

const AUTHOR_FIELDS = "name username avatar";

function serialize(c) {
  return {
    _id: c._id,
    content: c.content,
    post: c.post,
    parent: c.parent ?? null,
    replyTo: c.replyTo?.username ? { _id: c.replyTo._id, name: c.replyTo.name, username: c.replyTo.username } : null,
    repliesCount: c.repliesCount ?? 0,
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
  const comments = await Comment.find({ post: post._id, parent: null })
    .sort({ createdAt: 1 })
    .populate("author", AUTHOR_FIELDS);
  res.json({ comments: comments.map(serialize) });
}

/** Réponses à un commentaire, de la plus ancienne à la plus récente. */
async function listReplies(req, res) {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError("Commentaire introuvable", 404);
  await findVisiblePost(comment.post, req.user);
  const replies = await Comment.find({ parent: comment.parent ?? comment._id })
    .sort({ createdAt: 1 })
    .populate("author", AUTHOR_FIELDS)
    .populate("replyTo", "name username");
  res.json({ replies: replies.map(serialize) });
}

async function addComment(req, res) {
  const content = text(req.body.content);
  if (!content) throw new AppError("Le commentaire est vide");

  const post = await findVisiblePost(req.params.id, req.user);

  // Réponse : `parent` est le commentaire (ou la réponse) auquel on répond. Une réponse à une réponse
  // rejoint le même fil, avec la personne à qui elle s'adresse.
  let parent = null;
  let replyTo;
  if (req.body.parent !== undefined && req.body.parent !== null) {
    if (typeof req.body.parent !== "string" || !mongoose.isValidObjectId(req.body.parent)) {
      throw new AppError("Commentaire invalide", 400, "parent");
    }
    const target = await Comment.findOne({ _id: req.body.parent, post: post._id });
    if (!target) throw new AppError("Le commentaire auquel tu réponds n'existe plus", 404, "parent");
    parent = target.parent ?? target._id;
    replyTo = target.author;
  }

  const comment = await Comment.create({ post: post._id, author: req.user._id, content, parent, replyTo });
  await Post.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });
  if (parent) await Comment.updateOne({ _id: parent }, { $inc: { repliesCount: 1 } });

  const actor = req.user._id;
  if (replyTo) await Notification.push({ recipient: replyTo, actor, type: "reply", post: post._id, comment: comment._id });
  // L'auteur de l'article est prévenu de toute activité sur son article, sauf s'il vient d'être prévenu de la réponse.
  if (!replyTo || !replyTo.equals(post.author)) {
    await Notification.push({ recipient: post.author, actor, type: "comment", post: post._id, comment: comment._id });
  }

  await comment.populate([
    { path: "author", select: AUTHOR_FIELDS },
    { path: "replyTo", select: "name username" },
  ]);
  res.status(201).json({ comment: serialize(comment) });
}

async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.id).populate("post", "author");
  if (!comment) throw new AppError("Commentaire introuvable", 404);

  const uid = req.user._id;
  const allowed =
    comment.author.equals(uid) || comment.post?.author.equals(uid) || req.user.role === "admin";
  if (!allowed) throw new AppError("Action non autorisée", 403);

  // Un commentaire de premier niveau part avec ses réponses ; une réponse décompte son fil.
  const ids = [comment._id];
  if (comment.parent) {
    await Comment.updateOne({ _id: comment.parent, repliesCount: { $gt: 0 } }, { $inc: { repliesCount: -1 } });
  } else {
    const replies = await Comment.find({ parent: comment._id }).select("_id");
    ids.push(...replies.map((r) => r._id));
  }
  await Comment.deleteMany({ _id: { $in: ids } });
  // Les notifications de commentaires supprimés n'ont plus rien à montrer.
  await Notification.deleteMany({ comment: { $in: ids } });
  if (comment.post) {
    await Post.updateOne(
      { _id: comment.post._id },
      [{ $set: { commentsCount: { $max: [0, { $subtract: ["$commentsCount", ids.length] }] } } }],
      { updatePipeline: true }
    );
  }

  res.json({ message: "Commentaire supprimé", removed: ids.length });
}

module.exports = { listComments, listReplies, addComment, deleteComment };
