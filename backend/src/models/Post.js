const mongoose = require("mongoose");
const categories = require("../utils/categories");

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true, trim: true, maxlength: 10000 },
    category: { type: String, enum: categories, default: "Autre" },
    tags: [{ type: String, lowercase: true, trim: true }],
    image: {
      url: String,
      publicId: String,
    },
    visibility: { type: String, enum: ["public", "followers"], default: "public" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

postSchema.pre("validate", function () {
  const found = this.content?.match(/#([\p{L}0-9_]+)/gu) || [];
  const fromContent = found.map((t) => t.slice(1).toLowerCase());
  this.tags = [...new Set([...(this.tags || []), ...fromContent])].slice(0, 15);
});

module.exports = mongoose.model("Post", postSchema);
