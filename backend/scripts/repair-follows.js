// Remet d'accord les tableaux d'abonnements : pnpm repair:follows (ajoute --dry-run pour seulement compter).
// La référence est `following` (qui suit qui) ; `followers` de chaque compte est reconstruit à partir de lui,
// et les abonnements vers des comptes supprimés sont retirés.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const User = require("../src/models/User");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find().select("followers following").lean();
  const exists = new Set(users.map((u) => String(u._id)));
  const followers = new Map(users.map((u) => [String(u._id), []]));

  const writes = [];
  let dangling = 0;
  for (const u of users) {
    const kept = u.following.filter((id) => exists.has(String(id)) && !id.equals(u._id));
    if (kept.length !== u.following.length) {
      dangling += u.following.length - kept.length;
      writes.push({ updateOne: { filter: { _id: u._id }, update: { $set: { following: kept } } } });
    }
    for (const id of kept) followers.get(String(id)).push(u._id);
  }

  let fixed = 0;
  for (const u of users) {
    // On garde l'ordre existant pour ceux qui y sont déjà (l'ordre des abonnements), les oubliés à la fin.
    const real = followers.get(String(u._id));
    const realSet = new Set(real.map(String));
    const ordered = [
      ...u.followers.filter((id) => realSet.has(String(id))),
      ...real.filter((id) => !u.followers.some((f) => f.equals(id))),
    ];
    const unique = [...new Map(ordered.map((id) => [String(id), id])).values()];
    const same = unique.length === u.followers.length && unique.every((id, i) => id.equals(u.followers[i]));
    if (!same) {
      fixed++;
      writes.push({ updateOne: { filter: { _id: u._id }, update: { $set: { followers: unique } } } });
    }
  }

  if (!dryRun && writes.length) await User.bulkWrite(writes);
  console.log(
    `${users.length} comptes vérifiés : ${fixed} liste(s) d'abonnés ${dryRun ? "à corriger" : "corrigée(s)"}, ` +
      `${dangling} abonnement(s) vers des comptes disparus ${dryRun ? "à retirer" : "retiré(s)"}.`
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Réparation impossible :", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
