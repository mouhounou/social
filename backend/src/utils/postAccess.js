const Post = require("../models/Post");
const AppError = require("./AppError");

function canView(post, user) {
  if (post.visibility === "public") return true;
  if (!user) return false;
  const authorId = post.author._id ?? post.author;
  return (
    authorId.equals(user._id) || user.role === "admin" || user.following.some((id) => id.equals(authorId))
  );
}

async function findVisiblePost(id, user, populate) {
  const query = Post.findById(id);
  if (populate) query.populate("author", populate);
  const post = await query;
  if (!post) throw new AppError("Publication introuvable", 404);
  if (!canView(post, user)) throw new AppError("Cette publication est réservée aux abonnés", 403);
  return post;
}

module.exports = { canView, findVisiblePost };
