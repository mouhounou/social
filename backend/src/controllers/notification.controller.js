const Notification = require("../models/Notification");

async function listNotifications(req, res) {
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const items = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actor", "name username avatar")
    .populate("post", "title image");

  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });

  res.json({
    unread,
    notifications: items
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
        following: req.user.following.some((id) => id.equals(n.actor._id)),
      })),
  });
}

async function markAllRead(req, res) {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
}

module.exports = { listNotifications, markAllRead };
