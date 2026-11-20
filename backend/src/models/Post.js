const mongoose = require("mongoose");
const categories = require("../utils/categories");
const { MAX_PARAGRAPHS } = require("../utils/media");

// Image ou vidéo d'un paragraphe. Un fichier envoyé depuis l'appareil ou récupéré par lien est
// stocké sur Cloudinary ; une vidéo YouTube, Vimeo ou Dailymotion reste chez elle, lue dans son lecteur.
const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    provider: { type: String, enum: ["cloudinary", "youtube", "vimeo", "dailymotion"], required: true },
    url: { type: String, required: true },
    publicId: String,
    link: String,
  },
  { _id: false }
);

const paragraphSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Chaque paragraphe a besoin d'un titre"],
      maxlength: [150, "Le titre d'un paragraphe fait 150 caractères au plus"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [5000, "La description d'un paragraphe fait 5 000 caractères au plus"],
    },
    media: mediaSchema,
  },
  { _id: false }
);

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
    // Facultatifs : les publications d'avant les paragraphes n'en ont pas, et c'est toujours permis.
    paragraphs: {
      type: [paragraphSchema],
      default: [],
      validate: {
        validator: (list) => list.length <= MAX_PARAGRAPHS,
        message: `Pas plus de ${MAX_PARAGRAPHS} paragraphes par publication`,
      },
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

// Les hashtags du contenu et des descriptions de paragraphes deviennent des tags.
postSchema.pre("validate", function () {
  const texts = [this.content, ...(this.paragraphs || []).map((p) => p.description)];
  const found = texts.join("\n").match(/#([\p{L}0-9_]+)/gu) || [];
  const fromContent = found.map((t) => t.slice(1).toLowerCase());
  this.tags = [...new Set([...(this.tags || []), ...fromContent])].slice(0, 15);
});

/** Fichiers Cloudinary de la publication : l'image de couverture et les médias des paragraphes. */
postSchema.methods.storedMedia = function () {
  const files = [];
  if (this.image?.publicId) files.push({ publicId: this.image.publicId, type: "image" });
  for (const p of this.paragraphs || []) {
    if (p.media?.publicId) files.push({ publicId: p.media.publicId, type: p.media.type });
  }
  return files;
};

module.exports = mongoose.model("Post", postSchema);
