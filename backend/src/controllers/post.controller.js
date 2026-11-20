const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const categories = require("../utils/categories");
const { text, optionalText, positiveInt, tagList, MAX_TAGS } = require("../utils/input");
const { findVisiblePost } = require("../utils/postAccess");
const { MAX_PARAGRAPHS, IMAGE_MAX, parseLink, videoEmbed } = require("../utils/media");
const { uploadMedia, removeMedia } = require("../config/cloudinary");

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
    paragraphs: (p.paragraphs ?? []).map((para) => ({
      title: para.title,
      description: para.description || "",
      media: para.media
        ? { type: para.media.type, provider: para.media.provider, url: para.media.url, link: para.media.link || null }
        : null,
    })),
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
    filters.push({
      $or: [{ title: rx }, { content: rx }, { tags: rx }, { "paragraphs.title": rx }, { "paragraphs.description": rx }],
    });
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

function readTags(body) {
  const tags = tagList(body.tags);
  if (tags === null) throw new AppError("Les tags sont invalides");
  if (tags && tags.length > MAX_TAGS) throw new AppError(`Pas plus de ${MAX_TAGS} tags par publication`);
  return tags;
}

function invalidParagraphs() {
  return new AppError("Les paragraphes sont invalides", 400, "paragraphs");
}

function paragraphError(i, message, key = "") {
  return new AppError(`Paragraphe ${i + 1} : ${message}`, 400, `paragraphs.${i}${key && `.${key}`}`);
}

/**
 * Média demandé pour un paragraphe :
 * - `{ file: n }` : n-ième fichier envoyé dans le champ `media` (multipart) ;
 * - `{ link, type }` : lien vers une autre plateforme. YouTube, Vimeo et Dailymotion sont lus dans leur
 *   lecteur ; tout autre lien doit mener à un fichier image ou vidéo, récupéré sur Cloudinary ;
 * - `{ url }` : média déjà présent dans la publication, gardé tel quel (modification).
 */
function readMedia(spec, i, ctx) {
  if (spec === undefined || spec === null) return null;
  if (typeof spec !== "object" || Array.isArray(spec)) throw paragraphError(i, "média invalide", "media");

  if (spec.file !== undefined) {
    const file = Number.isInteger(spec.file) ? ctx.uploads[spec.file] : undefined;
    if (!file || ctx.used.has(spec.file)) throw paragraphError(i, "fichier introuvable", "media");
    ctx.used.add(spec.file);
    const type = file.mimetype.startsWith("video/") ? "video" : "image";
    if (type === "image" && file.size > IMAGE_MAX) throw paragraphError(i, "image trop lourde (5 Mo max)", "media");
    return { kind: "upload", type, source: file.path };
  }

  if (spec.link !== undefined) {
    const url = parseLink(spec.link);
    if (!url) throw paragraphError(i, "lien invalide, il doit commencer par http:// ou https://", "media");
    const embed = videoEmbed(url);
    if (embed) return { kind: "ready", media: { type: "video", provider: embed.provider, url: embed.url, link: url.href } };
    if (spec.type !== undefined && spec.type !== "image" && spec.type !== "video") {
      throw paragraphError(i, "type de média invalide", "media");
    }
    return { kind: "upload", type: spec.type ?? "image", source: url.href, link: url.href };
  }

  if (spec.url !== undefined) {
    const kept = ctx.existing.find((m) => m.url === spec.url);
    if (!kept) throw paragraphError(i, "média introuvable dans cette publication", "media");
    return { kind: "ready", media: kept };
  }

  throw paragraphError(i, "média invalide", "media");
}

// undefined : paragraphes absents de la requête, donc inchangés. Sinon, la liste complète dans l'ordre.
// En multipart, `paragraphs` est une chaîne JSON ; en JSON, un tableau.
function readParagraphs(body, files, existing = []) {
  let list = body.paragraphs;
  if (list === undefined) return undefined;
  if (typeof list === "string") {
    try {
      list = list.trim() ? JSON.parse(list) : [];
    } catch {
      throw invalidParagraphs();
    }
  }
  if (!Array.isArray(list)) throw invalidParagraphs();
  if (list.length > MAX_PARAGRAPHS) {
    throw new AppError(`Pas plus de ${MAX_PARAGRAPHS} paragraphes par publication`, 400, "paragraphs");
  }

  const ctx = { uploads: files?.media ?? [], used: new Set(), existing };
  return list.map((p, i) => {
    if (!p || typeof p !== "object" || Array.isArray(p)) throw invalidParagraphs();
    const title = optionalText(p.title);
    const description = optionalText(p.description);
    if (title === null) throw paragraphError(i, "titre invalide", "title");
    if (description === null) throw paragraphError(i, "description invalide", "description");
    if (!title) throw paragraphError(i, "le titre est obligatoire", "title");
    return { title, description: description ?? "", media: readMedia(p.media, i, ctx) };
  });
}

function draftParagraphs(plan) {
  return plan.map(({ title, description, media }) => ({
    title,
    description,
    media: media?.kind === "ready" ? media.media : undefined,
  }));
}

function readCover(files) {
  const cover = files?.image?.[0];
  if (cover && cover.size > IMAGE_MAX) throw new AppError("Image trop lourde (5 Mo max)", 400, "image");
  return cover;
}

function uploadFailure(err, job) {
  if (!err.rejected) return err;
  if (job.paragraph === undefined) return new AppError("Image illisible ou format non accepté", 400, "image");
  const i = job.paragraph;
  if (!job.link) return paragraphError(i, "fichier illisible ou format non accepté", "media");
  return job.type === "image"
    ? paragraphError(i, "impossible de récupérer l'image à ce lien. Il doit mener directement à une image JPEG, PNG, WebP, GIF ou AVIF", "media")
    : paragraphError(i, "impossible de récupérer la vidéo à ce lien. Utilise un lien YouTube, Vimeo, Dailymotion ou celui d'un fichier MP4, WebM ou MOV", "media");
}

const removeAll = (files) => Promise.all(files.map((f) => removeMedia(f.publicId, f.type)));

/**
 * Envoie sur Cloudinary la couverture et les médias des paragraphes (fichiers ou liens), quatre à la fois,
 * puis les range dans la publication. Au premier échec, plus rien ne part et ce qui est déjà envoyé est supprimé.
 * Renvoie les fichiers envoyés, à supprimer si l'enregistrement échoue ensuite.
 */
async function storeMedia(post, plan, cover) {
  const jobs = [];
  if (cover) jobs.push({ type: "image", source: cover.path });
  plan?.forEach((p, i) => {
    if (p.media?.kind === "upload") jobs.push({ paragraph: i, ...p.media });
  });

  const stored = [];
  let failure = null;
  let next = 0;
  async function worker() {
    while (!failure && next < jobs.length) {
      const job = jobs[next++];
      try {
        job.result = await uploadMedia(job.source, "posts", job.type);
        stored.push({ publicId: job.result.publicId, type: job.type });
      } catch (err) {
        failure ??= uploadFailure(err, job);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, jobs.length) }, worker));

  if (failure) {
    await removeAll(stored);
    throw failure;
  }

  for (const job of jobs) {
    if (job.paragraph === undefined) {
      post.image = job.result;
    } else {
      post.paragraphs[job.paragraph].media = {
        type: job.type,
        provider: "cloudinary",
        url: job.result.url,
        publicId: job.result.publicId,
        link: job.link,
      };
    }
  }
  return stored;
}

async function saveWithMedia(post, stored) {
  try {
    await post.save();
  } catch (err) {
    await removeAll(stored);
    throw err;
  }
}

async function createPost(req, res) {
  const fields = readFields(req.body);
  if (!fields.title || !fields.content) throw new AppError("Le titre et le contenu sont obligatoires");

  const tags = readTags(req.body);
  const plan = readParagraphs(req.body, req.files);
  const cover = readCover(req.files);

  const post = new Post({ ...fields, tags, paragraphs: draftParagraphs(plan ?? []), author: req.user._id });
  await post.validate();

  const stored = await storeMedia(post, plan, cover);
  await saveWithMedia(post, stored);
  await post.populate("author", AUTHOR_FIELDS);

  res.status(201).json({ post: serialize(post, req.user) });
}

async function updatePost(req, res) {
  const post = await Post.findById(req.params.id).populate("author", AUTHOR_FIELDS);
  if (!post) throw new AppError("Publication introuvable", 404);
  if (!canEdit(post, req.user)) throw new AppError("Tu ne peux modifier que tes publications", 403);

  const fields = readFields(req.body);
  const tags = readTags(req.body);
  const existing = post.paragraphs.filter((p) => p.media).map((p) => p.media.toObject());
  const plan = readParagraphs(req.body, req.files, existing);
  const cover = readCover(req.files);
  const before = post.storedMedia();

  Object.assign(post, fields);
  if (plan) post.paragraphs = draftParagraphs(plan);
  // Les hashtags du texte sont recalculés à la validation.
  if (tags) post.tags = tags;
  else if (fields.content !== undefined || plan) post.tags = [];
  if (!cover && req.body.removeImage === "true") post.image = undefined;
  await post.validate();

  const stored = await storeMedia(post, plan, cover);
  await saveWithMedia(post, stored);

  // Les fichiers remplacés ou retirés quittent Cloudinary une fois la publication enregistrée.
  const kept = new Set(post.storedMedia().map((f) => f.publicId));
  await removeAll(before.filter((f) => !kept.has(f.publicId)));

  res.json({ post: serialize(post, req.user) });
}

async function deletePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError("Publication introuvable", 404);
  if (!canEdit(post, req.user)) throw new AppError("Tu ne peux supprimer que tes publications", 403);

  await post.deleteOne();
  await Promise.all([
    removeAll(post.storedMedia()),
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
