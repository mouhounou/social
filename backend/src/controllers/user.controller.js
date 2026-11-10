const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const { uploadBuffer, removeImage } = require("../config/cloudinary");

function profileOf(user, viewer) {
  const data = user.toPublic();
  delete data.email;
  data.isFollowing = viewer ? user.followers.some((id) => id.equals(viewer._id)) : false;
  data.isMe = viewer ? user._id.equals(viewer._id) : false;
  return data;
}

async function getProfile(req, res) {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user || user.isBlocked) throw new AppError("Utilisateur introuvable", 404);

  const postsCount = await Post.countDocuments({ author: user._id });
  res.json({ user: { ...profileOf(user, req.user), postsCount } });
}

async function myStats(req, res) {
  const postsCount = await Post.countDocuments({ author: req.user._id });
  res.json({ user: { ...req.user.toPublic(), postsCount } });
}

async function updateMe(req, res) {
  const user = req.user;
  const { name, bio, username } = req.body;

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (username !== undefined) user.username = username;

  const avatar = req.files?.avatar?.[0];
  const cover = req.files?.cover?.[0];

  if (avatar) {
    const old = user.avatar?.publicId;
    user.avatar = await uploadBuffer(avatar.buffer, "avatars");
    await removeImage(old);
  }
  if (cover) {
    const old = user.cover?.publicId;
    user.cover = await uploadBuffer(cover.buffer, "covers");
    await removeImage(old);
  }

  await user.save();
  res.json({ user: user.toPublic() });
}

async function toggleFollow(req, res) {
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError("Utilisateur introuvable", 404);

  const me = req.user;
  if (target._id.equals(me._id)) throw new AppError("Tu ne peux pas te suivre toi-même");

  const following = me.following.some((id) => id.equals(target._id));

  if (following) {
    await User.updateOne({ _id: me._id }, { $pull: { following: target._id } });
    await User.updateOne({ _id: target._id }, { $pull: { followers: me._id } });
  } else {
    await User.updateOne({ _id: me._id }, { $addToSet: { following: target._id } });
    await User.updateOne({ _id: target._id }, { $addToSet: { followers: me._id } });
    await Notification.push({ recipient: target._id, actor: me._id, type: "follow" });
  }

  res.json({ following: !following });
}

async function suggestions(req, res) {
  const me = req.user;
  const exclude = me ? [me._id, ...me.following] : [];

  const users = await User.aggregate([
    { $match: { _id: { $nin: exclude }, isBlocked: false } },
    { $addFields: { followersCount: { $size: "$followers" } } },
    { $sort: { followersCount: -1, createdAt: -1 } },
    { $limit: 5 },
    { $project: { name: 1, username: 1, avatar: "$avatar.url", followers: 1, followersCount: 1 } },
  ]);

  const result = await Promise.all(
    users.map(async (u) => {
      let hint = "Suggéré pour toi";
      const followed = new Set((me?.following || []).map(String));
      const mutualId = u.followers.find((id) => followed.has(String(id)));
      if (mutualId) {
        const mutual = await User.findById(mutualId).select("username");
        if (mutual) hint = `Suivi par ${mutual.username}`;
      }
      return {
        _id: u._id,
        name: u.name,
        username: u.username,
        avatar: u.avatar || null,
        followersCount: u.followersCount,
        hint,
      };
    })
  );

  res.json({ users: result });
}

module.exports = { getProfile, myStats, updateMe, toggleFollow, suggestions };
