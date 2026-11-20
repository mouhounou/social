const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "comment", "follow"], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    // Pour un commentaire : le commentaire lui-même, dont la notification montre le début.
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

notificationSchema.statics.push = async function ({ recipient, actor, type, post, comment }) {
  if (String(recipient) === String(actor)) return;
  if (type === "comment") {
    await this.create({ recipient, actor, type, post, comment });
    return;
  }
  await this.findOneAndUpdate(
    { recipient, actor, type, post: post ?? null },
    { $set: { read: false, createdAt: new Date() } },
    { upsert: true, timestamps: false }
  );
};

notificationSchema.statics.pull = function ({ recipient, actor, type, post }) {
  return this.deleteOne({ recipient, actor, type, post: post ?? null });
};

module.exports = mongoose.model("Notification", notificationSchema);
