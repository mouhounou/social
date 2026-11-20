const mongoose = require("mongoose");

// Un commentaire est soit un commentaire de premier niveau (parent vide, comme tous ceux d'avant les réponses),
// soit une réponse rattachée à un commentaire de premier niveau : un seul niveau de réponses.
const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    // La personne à qui l'on répond : l'auteur du commentaire, ou de la réponse, sur lequel on a cliqué.
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    repliesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, parent: 1, createdAt: 1 });
commentSchema.index({ parent: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
