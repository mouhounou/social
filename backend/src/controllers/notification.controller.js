const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const { text, positiveInt } = require("../utils/input");

const TYPES = ["like", "comment", "follow"];
// Le filtre « comment » couvre aussi les réponses à ses commentaires.
const FILTERS = { like: "like", comment: { $in: ["comment", "reply"] }, follow: "follow" };

// Filtre facultatif par type, et pagination classique : `page` et `limit` (20 par défaut, 50 au plus).
async function listNotifications(req, res) {
  const limit = positiveInt(req.query.limit, 20, 50);
  const page = positiveInt(req.query.page, 1);
  const type = text(req.query.type);
  if (type && !TYPES.includes(type)) throw new AppError("Type de notification inconnu");

  const filter = { recipient: req.user._id };
  if (type) filter.type = FILTERS[type];

  const [rows, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("actor", "name username avatar")
      .populate("post", "title image")
      .populate("comment", "content"),
    Notification.countDocuments(filter),
  ]);

  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });

  res.json({
    unread,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
    notifications: rows
      .filter((n) => n.actor)
      .map((n) => ({
        _id: n._id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
        actor: {
          _id: n.actor._id,
          name: n.actor.name,
          username: n.actor.username,
          avatar: n.actor.avatar?.url || null,
        },
        post: n.post ? { _id: n.post._id, title: n.post.title, image: n.post.image?.url || null } : null,
        comment: n.comment ? { _id: n.comment._id, content: n.comment.content } : null,
        following: req.user.following.some((id) => id.equals(n.actor._id)),
      })),
  });
}

async function markAllRead(req, res) {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
}

module.exports = { listNotifications, markAllRead };
