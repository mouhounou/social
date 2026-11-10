const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { EMAIL_RE } = require("../utils/input");

const imageSchema = new mongoose.Schema(
  { url: String, publicId: String },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9_.]{3,30}$/, "Nom d'utilisateur invalide"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_RE, "Adresse email invalide"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    passwordChangedAt: { type: Date, select: false },
    role: { type: String, enum: ["reader", "author", "admin"], default: "reader" },
    bio: { type: String, maxlength: 160, default: "" },
    location: { type: String, trim: true, maxlength: 60, default: "" },
    website: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
      match: [/^$|^https?:\/\/[^\s]+$/, "Le site doit commencer par http:// ou https://"],
    },
    avatar: imageSchema,
    cover: imageSchema,
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    role: this.role,
    bio: this.bio,
    location: this.location,
    website: this.website,
    avatar: this.avatar?.url || null,
    cover: this.cover?.url || null,
    followersCount: this.followers.length,
    followingCount: this.following.length,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
