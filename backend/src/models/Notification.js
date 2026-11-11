const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "comment", "follow"], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.statics.push = async function ({ recipient, actor, type, post }) {
  if (String(recipient) === String(actor)) return;
  if (type === "comment") {
    await this.create({ recipient, actor, type, post });
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
