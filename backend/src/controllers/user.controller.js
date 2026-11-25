const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const { optionalText, PASSWORD_MIN } = require("../utils/input");
const { uploadBuffer, removeImage } = require("../config/cloudinary");
const { signToken, setAuthCookie } = require("../utils/token");

// Qui suit qui : la référence est le tableau `following` de chaque compte, celui qui ouvre les
// publications réservées aux abonnés. Le tableau `followers` n'en est qu'une copie, qui a pu diverger.
const followersOf = (user) => ({ following: user._id, isBlocked: { $ne: true } });
const followedBy = (user) => ({ _id: { $in: user.following }, isBlocked: { $ne: true } });

function profileOf(user, viewer) {
  const data = user.toPublic();
  delete data.email;
  data.isFollowing = viewer ? viewer.following.some((id) => id.equals(user._id)) : false;
  data.isMe = viewer ? user._id.equals(viewer._id) : false;
  return data;
}

async function getProfile(req, res) {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user || user.isBlocked) throw new AppError("Utilisateur introuvable", 404);

  // Mêmes règles que les listes d'abonnés et d'abonnements : les nombres affichés leur correspondent.
  const [postsCount, followersCount, followingCount] = await Promise.all([
    Post.countDocuments({ author: user._id }),
    User.countDocuments(followersOf(user)),
    User.countDocuments(followedBy(user)),
  ]);
  res.json({ user: { ...profileOf(user, req.user), postsCount, followersCount, followingCount } });
}

async function myStats(req, res) {
  const postsCount = await Post.countDocuments({ author: req.user._id });
  res.json({ user: { ...req.user.toPublic(), postsCount } });
}

async function updateMe(req, res) {
  const user = req.user;
  for (const field of ["name", "username", "bio", "location", "website"]) {
    const value = optionalText(req.body[field]);
    if (value === null) throw new AppError(`Le champ ${field} est invalide`);
    if (value !== undefined) user[field] = value;
  }
  await user.validate();

  const previous = { avatar: user.avatar?.publicId, cover: user.cover?.publicId };

  for (const [field, folder] of [["avatar", "avatars"], ["cover", "covers"]]) {
    const file = req.files?.[field]?.[0];
    const removeKey = `remove${field[0].toUpperCase()}${field.slice(1)}`;
    if (file) user[field] = await uploadBuffer(file.buffer, folder);
    else if (req.body[removeKey] === "true") user[field] = undefined;
  }

  await user.save();

  for (const field of ["avatar", "cover"]) {
    if (previous[field] && previous[field] !== user[field]?.publicId) await removeImage(previous[field]);
  }

  res.json({ user: user.toPublic() });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
    throw new AppError("Remplis les deux champs");
  }
  if (newPassword.length < PASSWORD_MIN) {
    throw new AppError(`Le nouveau mot de passe doit faire au moins ${PASSWORD_MIN} caractères`, 400, "newPassword");
  }
  if (Buffer.byteLength(newPassword) > 72) {
    throw new AppError("Le mot de passe est trop long (72 caractères max)", 400, "newPassword");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("Mot de passe actuel incorrect", 401, "currentPassword");
  }

  user.password = newPassword;
  await user.save();

  setAuthCookie(res, signToken(user));
  res.json({ message: "Mot de passe mis à jour" });
}

function connections(field) {
  return async (req, res) => {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).select("followers following isBlocked");
    if (!user || user.isBlocked) throw new AppError("Utilisateur introuvable", 404);

    // « Abonnés » : seulement les comptes qui suivent vraiment celui-ci.
    const people = await User.find(field === "followers" ? followersOf(user) : followedBy(user)).select(
      "name username avatar bio following"
    );
    // Les plus récents d'abord : les tableaux gardent l'ordre des abonnements.
    const rank = new Map([...user[field]].reverse().map((id, i) => [String(id), i]));
    const position = (u) => rank.get(String(u._id)) ?? rank.size;
    people.sort((a, b) => position(a) - position(b));

    const viewer = req.user;
    const followed = new Set((viewer?.following || []).map(String));
    const users = people.map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      avatar: u.avatar?.url || null,
      bio: u.bio,
      isFollowing: followed.has(String(u._id)),
      followsYou: viewer ? u.following.some((id) => id.equals(viewer._id)) : false,
      isMe: viewer ? u._id.equals(viewer._id) : false,
    }));

    res.json({ users });
  };
}

const followers = connections("followers");
const following = connections("following");

async function toggleFollow(req, res) {
  const target = await User.findById(req.params.id);
  if (!target || target.isBlocked) throw new AppError("Utilisateur introuvable", 404);

  const me = req.user;
  if (target._id.equals(me._id)) throw new AppError("Tu ne peux pas te suivre toi-même");

  const added = await User.updateOne({ _id: me._id, following: { $ne: target._id } }, { $push: { following: target._id } });
  const following = added.modifiedCount === 1;
  const notification = { recipient: target._id, actor: me._id, type: "follow" };

  if (following) {
    await User.updateOne({ _id: target._id }, { $addToSet: { followers: me._id } });
    await Notification.push(notification);
  } else {
    await User.updateOne({ _id: me._id }, { $pull: { following: target._id } });
    await User.updateOne({ _id: target._id }, { $pull: { followers: me._id } });
    await Notification.pull(notification);
  }

  res.json({ following });
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

module.exports = {
  getProfile,
  myStats,
  updateMe,
  changePassword,
  toggleFollow,
  suggestions,
  followers,
  following,
};
