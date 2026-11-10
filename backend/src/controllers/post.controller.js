const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const categories = require("../utils/categories");
const { uploadBuffer, removeImage } = require("../config/cloudinary");

const AUTHOR_FIELDS = "name username avatar role";

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serialize(post, user) {
  const p = post.toObject ? post.toObject() : post;
  const uid = user?._id?.toString();
  return {
    _id: p._id,
    title: p.title,
    content: p.content,
    category: p.category,
    tags: p.tags,
    image: p.image?.url || null,
    visibility: p.visibility,
    author: p.author && {
      _id: p.author._id,
      name: p.author.name,
      username: p.author.username,
      avatar: p.author.avatar?.url || null,
    },
    likesCount: p.likes.length,
    savesCount: p.saves.length,
    commentsCount: p.commentsCount,
    liked: uid ? p.likes.some((id) => id.toString() === uid) : false,
    saved: uid ? p.saves.some((id) => id.toString() === uid) : false,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function canEdit(post, user) {
  return post.author._id.toString() === user._id.toString() || user.role === "admin";
}

async function visibilityFilter(user) {
  if (!user) return { visibility: "public" };
  return {
    $or: [
      { visibility: "public" },
      { author: user._id },
      { author: { $in: user.following } },
    ],
  };
}

function listCategories(req, res) {
  res.json({ categories });
}

async function listPosts(req, res) {
  const { q, category, tag, author, sort = "recent", saved } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(30, Number(req.query.limit) || 10);

  const filters = [await visibilityFilter(req.user)];

  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filters.push({ $or: [{ title: rx }, { content: rx }, { tags: rx }] });
  }
  if (category) filters.push({ category });
  if (tag) filters.push({ tags: tag.toLowerCase() });
  if (author) {
    const user = await User.findOne({ username: author.toLowerCase() }).select("_id");
    filters.push({ author: user?._id ?? null });
  }
  if (saved === "true" && req.user) filters.push({ saves: req.user._id });

  const where = { $and: filters };
  const order = sort === "popular" ? { commentsCount: -1, createdAt: -1 } : { createdAt: -1 };

  const [posts, total] = await Promise.all([
    Post.find(where)
      .sort(order)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", AUTHOR_FIELDS),
    Post.countDocuments(where),
  ]);

  res.json({
    posts: posts.map((p) => serialize(p, req.user)),
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
}

async function getPost(req, res) {
  const post = await Post.findById(req.params.id).populate("author", AUTHOR_FIELDS);
  if (!post) throw new AppError("Publication introuvable", 404);

  if (post.visibility === "followers") {
    const user = req.user;
    const allowed =
      user &&
      (post.author._id.equals(user._id) || user.following.some((id) => id.equals(post.author._id)));
    if (!allowed) throw new AppError("Cette publication est réservée aux abonnés", 403);
  }

  res.json({ post: serialize(post, req.user) });
}

async function createPost(req, res) {
  const { title, content, category, visibility } = req.body;
  if (!title || !content) throw new AppError("Le titre et le contenu sont obligatoires");

  const post = new Post({
    author: req.user._id,
    title,
    content,
    category,
    visibility,
  });

  if (req.file) post.image = await uploadBuffer(req.file.buffer, "posts");

  await post.save();
  await post.populate("author", AUTHOR_FIELDS);

  res.status(201).json({ post: serialize(post, req.user) });
}

async function updatePost(req, res) {
  const post = await Post.findById(req.params.id).populate("author", AUTHOR_FIELDS);
  if (!post) throw new AppError("Publication introuvable", 404);
  if (!canEdit(post, req.user)) throw new AppError("Tu ne peux modifier que tes publications", 403);

  for (const field of ["title", "content", "category", "visibility"]) {
    if (req.body[field] !== undefined) post[field] = req.body[field];
  }
  if (req.body.content !== undefined) post.tags = [];

  if (req.file) {
    const old = post.image?.publicId;
    post.image = await uploadBuffer(req.file.buffer, "posts");
    await removeImage(old);
  } else if (req.body.removeImage === "true" && post.image?.publicId) {
    await removeImage(post.image.publicId);
    post.image = undefined;
  }

  await post.save();
  res.json({ post: serialize(post, req.user) });
}

async function deletePost(req, res) {
  const post = await Post.findById(req.params.id).populate("author", "_id");
  if (!post) throw new AppError("Publication introuvable", 404);
  if (!canEdit(post, req.user)) throw new AppError("Tu ne peux supprimer que tes publications", 403);

  await Promise.all([
    removeImage(post.image?.publicId),
    Comment.deleteMany({ post: post._id }),
    Notification.deleteMany({ post: post._id }),
  ]);
  await post.deleteOne();

  res.json({ message: "Publication supprimée" });
}

async function toggle(req, res, field) {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError("Publication introuvable", 404);

  const uid = req.user._id;
  const active = post[field].some((id) => id.equals(uid));

  await Post.updateOne({ _id: post._id }, active ? { $pull: { [field]: uid } } : { $addToSet: { [field]: uid } });

  if (field === "likes" && !active) {
    await Notification.push({ recipient: post.author, actor: uid, type: "like", post: post._id });
  }

  const count = post[field].length + (active ? -1 : 1);
  res.json({ active: !active, count });
}

const likePost = (req, res) => toggle(req, res, "likes");
const savePost = (req, res) => toggle(req, res, "saves");

module.exports = {
  listCategories,
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  savePost,
};
