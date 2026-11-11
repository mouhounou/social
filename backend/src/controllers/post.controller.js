const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const categories = require("../utils/categories");
const { text, optionalText, positiveInt } = require("../utils/input");
const { findVisiblePost } = require("../utils/postAccess");
const { uploadBuffer, removeImage } = require("../config/cloudinary");

const AUTHOR_FIELDS = "name username avatar role";
const EDITABLE = ["title", "content", "category", "visibility"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const authorId = post.author._id ?? post.author;
  return authorId.equals(user._id) || user.role === "admin";
}

function visibilityFilter(user) {
  if (!user) return { visibility: "public" };
  if (user.role === "admin") return {};
  return {
    $or: [{ visibility: "public" }, { author: user._id }, { author: { $in: user.following } }],
  };
}

function listCategories(req, res) {
  res.json({ categories });
}

async function listPosts(req, res) {
  const q = text(req.query.q).slice(0, 100);
  const category = text(req.query.category);
  const tag = text(req.query.tag).toLowerCase();
  const author = text(req.query.author).toLowerCase();
  const sort = text(req.query.sort) === "popular" ? "popular" : "recent";
  const page = positiveInt(req.query.page, 1);
  const limit = positiveInt(req.query.limit, 10, 30);

  if (req.query.saved === "true" && !req.user) throw new AppError("Connecte-toi pour voir tes enregistrements", 401);

  const filters = [visibilityFilter(req.user)];

  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filters.push({ $or: [{ title: rx }, { content: rx }, { tags: rx }] });
  }
  if (category) filters.push({ category });
  if (tag) filters.push({ tags: tag });
  if (author) {
    const user = await User.findOne({ username: author }).select("_id");
    filters.push({ author: user?._id ?? null });
  }
  if (req.query.saved === "true") filters.push({ saves: req.user._id });

  const where = { $and: filters };
  const skip = (page - 1) * limit;

  let posts;
  if (sort === "popular") {
    const rows = await Post.aggregate([
      { $match: where },
      { $addFields: { score: { $add: [{ $size: "$likes" }, "$commentsCount"] } } },
      { $sort: { score: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    posts = await Post.populate(
      rows.map((row) => Post.hydrate(row)),
      { path: "author", select: AUTHOR_FIELDS }
    );
  } else {
    posts = await Post.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("author", AUTHOR_FIELDS);
  }

  const total = await Post.countDocuments(where);

  res.json({
    posts: posts.map((p) => serialize(p, req.user)),
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
}

async function getPost(req, res) {
  const post = await findVisiblePost(req.params.id, req.user, AUTHOR_FIELDS);
  res.json({ post: serialize(post, req.user) });
}

function readFields(body) {
  const fields = {};
  for (const key of EDITABLE) {
    const value = optionalText(body[key]);
    if (value === null) throw new AppError(`Le champ ${key} est invalide`);
    if (value !== undefined) fields[key] = value;
  }
  return fields;
}

async function createPost(req, res) {
  const fields = readFields(req.body);
  if (!fields.title || !fields.content) throw new AppError("Le titre et le contenu sont obligatoires");

  const post = new Post({ ...fields, author: req.user._id });
  await post.validate();

  if (req.file) post.image = await uploadBuffer(req.file.buffer, "posts");

  await post.save();
  await post.populate("author", AUTHOR_FIELDS);

  res.status(201).json({ post: serialize(post, req.user) });
}

async function updatePost(req, res) {
  const post = await Post.findById(req.params.id).populate("author", AUTHOR_FIELDS);
  if (!post) throw new AppError("Publication introuvable", 404);
  if (!canEdit(post, req.user)) throw new AppError("Tu ne peux modifier que tes publications", 403);

  const fields = readFields(req.body);
  Object.assign(post, fields);
  if (fields.content !== undefined) post.tags = [];
  await post.validate();

  const oldImage = post.image?.publicId;
  if (req.file) {
    post.image = await uploadBuffer(req.file.buffer, "posts");
  } else if (req.body.removeImage === "true") {
    post.image = undefined;
  }

  await post.save();
  if (oldImage && oldImage !== post.image?.publicId) await removeImage(oldImage);

  res.json({ post: serialize(post, req.user) });
}

async function deletePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError("Publication introuvable", 404);
  if (!canEdit(post, req.user)) throw new AppError("Tu ne peux supprimer que tes publications", 403);

  await post.deleteOne();
  await Promise.all([
    removeImage(post.image?.publicId),
    Comment.deleteMany({ post: post._id }),
    Notification.deleteMany({ post: post._id }),
  ]);

  res.json({ message: "Publication supprimée" });
}

async function toggle(req, res, field) {
  const post = await findVisiblePost(req.params.id, req.user);
  const uid = req.user._id;
  const options = { returnDocument: "after", projection: { [field]: 1 } };

  let updated = await Post.findOneAndUpdate({ _id: post._id, [field]: { $ne: uid } }, { $push: { [field]: uid } }, options);
  const active = !!updated;
  if (!updated) updated = await Post.findOneAndUpdate({ _id: post._id }, { $pull: { [field]: uid } }, options);
  if (!updated) throw new AppError("Publication introuvable", 404);

  if (field === "likes") {
    const notification = { recipient: post.author, actor: uid, type: "like", post: post._id };
    await (active ? Notification.push(notification) : Notification.pull(notification));
  }

  res.json({ active, count: updated[field].length });
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
