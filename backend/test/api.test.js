const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const mongoose = require("mongoose");
const { start, stop, client, signup, lastOtp, mailer } = require("./helpers");

let author, reader, other, guest;
let publicPost, privatePost;

before(async () => {
  await start();
  author = await signup("auteur", "author");
  reader = await signup("lecteur");
  other = await signup("autre", "author");
  guest = client();

  publicPost = (await author.post("/posts", { title: "Public", content: "Bonjour #art", category: "Design" })).data.post;
  privatePost = (await author.post("/posts", { title: "Privé", content: "Abonnés seulement", visibility: "followers" })).data.post;
});

after(stop);

describe("requêtes mal formées", () => {
  it("répond 400 et non 500 quand le corps est absent", async () => {
    for (const path of ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/verify-otp", "/auth/reset-password"]) {
      const res = await guest.post(path);
      assert.equal(res.status, 400, path);
    }
  });

  it("répond 400 sur un JSON invalide", async () => {
    const res = await guest.raw("POST", "/auth/login", "{oops", { "Content-Type": "application/json" });
    assert.equal(res.status, 400);
    assert.equal(res.data.message, "JSON invalide");
  });

  it("refuse les objets à la place des chaînes", async () => {
    const login = await guest.post("/auth/login", { identifier: { $ne: null }, password: "x" });
    assert.equal(login.status, 400);
    const reset = await guest.post("/auth/reset-password", { email: "a@b.c", resetToken: { a: 1 }, password: "secret1" });
    assert.equal(reset.status, 400);
    const post = await author.post("/posts", { title: { a: 1 }, content: "x" });
    assert.equal(post.status, 400);
  });

  it("supporte les paramètres répétés et bornés", async () => {
    assert.equal((await guest.get("/posts?q=a&q=b")).status, 200);
    const res = await guest.get("/posts?limit=-3&page=abc");
    assert.equal(res.status, 200);
    assert.equal(res.data.page, 1);
    assert.ok(res.data.pages >= 1);
  });

  it("répond 400 sur un identifiant invalide", async () => {
    assert.equal((await guest.get("/posts/pas-un-id")).status, 400);
  });
});

describe("inscription et connexion", () => {
  it("valide l'email, le mot de passe et l'unicité", async () => {
    const bad = await guest.post("/auth/register", { name: "X", username: "xx_1", email: "pas-un-email", password: "secret1" });
    assert.equal(bad.status, 400);
    assert.equal(bad.data.field, "email");
    const short = await guest.post("/auth/register", { name: "X", username: "xx_2", email: "x2@test.dev", password: "1234" });
    assert.equal(short.status, 400);
    assert.equal(short.data.field, "password");
    const long = await guest.post("/auth/register", { name: "X", username: "xx_3", email: "x3@test.dev", password: "a".repeat(80) });
    assert.equal(long.status, 400);
    const spaced = await guest.post("/auth/register", { name: "X", username: "Le Boss", email: "x5@test.dev", password: "secret1" });
    assert.equal(spaced.status, 400);
    assert.equal(spaced.data.field, "username");
    const dup = await guest.post("/auth/register", { name: "X", username: "auteur", email: "x4@test.dev", password: "secret1" });
    assert.equal(dup.status, 409);
    assert.equal(dup.data.field, "username");
  });

  it("ne confirme pas qu'un email a déjà un compte", async () => {
    const res = await guest.post("/auth/register", { name: "X", username: "xx_6", email: "auteur@test.dev", password: "secret1" });
    assert.equal(res.status, 400);
    assert.equal(res.data.field, undefined);
    assert.doesNotMatch(res.data.message, /e-?mail|adresse|utilisé/i);
    assert.equal((await client().post("/auth/login", { identifier: "xx_6", password: "secret1" })).status, 401);
  });

  it("accepte n'importe quel mot de passe de 5 caractères ou plus", async () => {
    const c = client();
    const res = await c.post("/auth/register", { name: "Court", username: "court", email: "court@test.dev", password: "abcde" });
    assert.equal(res.status, 201);
    assert.equal((await client().post("/auth/login", { identifier: "court", password: "abcde" })).status, 200);
  });

  it("ne laisse pas s'inscrire en admin", async () => {
    const c = client();
    const res = await c.post("/auth/register", { name: "X", username: "pirate", email: "pirate@test.dev", password: "secret1", role: "admin" });
    assert.equal(res.status, 201);
    assert.equal(res.data.user.role, "reader");
  });

  it("connecte par email ou pseudo et refuse un mauvais mot de passe", async () => {
    const c = client();
    assert.equal((await c.post("/auth/login", { identifier: "LECTEUR@test.dev", password: "secret1" })).status, 200);
    assert.equal((await c.get("/auth/session")).data.user.username, "lecteur");
    assert.equal((await client().post("/auth/login", { identifier: "lecteur", password: "faux" })).status, 401);
  });

  it("déconnecte", async () => {
    const c = client();
    await c.post("/auth/login", { identifier: "lecteur", password: "secret1" });
    await c.post("/auth/logout");
    assert.equal((await c.get("/auth/session")).data.user, null);
  });
});

describe("articles", () => {
  it("réserve la publication aux auteurs", async () => {
    assert.equal((await reader.post("/posts", { title: "t", content: "c" })).status, 403);
    assert.equal((await guest.post("/posts", { title: "t", content: "c" })).status, 401);
  });

  it("extrait les hashtags et filtre", async () => {
    assert.deepEqual(publicPost.tags, ["art"]);
    assert.equal((await guest.get("/posts?tag=art")).data.total, 1);
    assert.equal((await guest.get("/posts?category=Design")).data.total, 1);
    assert.equal((await guest.get("/posts?q=BONJOUR")).data.total, 1);
    assert.equal((await guest.get("/posts?author=auteur")).data.total, 1);
  });

  it("accepte jusqu'à 7 tags saisis à la main, en plus des hashtags du texte", async () => {
    const res = await author.post("/posts", { title: "Tags", content: "Texte #Photo", tags: ["#Voyage", "photo", "voyage"] });
    assert.equal(res.status, 201);
    assert.deepEqual(res.data.post.tags, ["voyage", "photo"]);
    const id = res.data.post._id;

    const form = new FormData();
    form.append("tags", "mer, #plage");
    assert.deepEqual((await author.patch(`/posts/${id}`, form)).data.post.tags, ["mer", "plage", "photo"]);
    assert.deepEqual((await author.patch(`/posts/${id}`, { tags: "" })).data.post.tags, ["photo"]);

    const eight = ["a", "b", "c", "d", "e", "f", "g", "h"];
    assert.equal((await author.post("/posts", { title: "t", content: "c", tags: eight })).status, 400);
    assert.equal((await author.post("/posts", { title: "t", content: "c", tags: ["pas valide!"] })).status, 400);
    assert.equal((await author.post("/posts", { title: "t", content: "c", tags: { $ne: 1 } })).status, 400);
    await author.delete(`/posts/${id}`);
  });

  it("refuse l'envoi d'image quand Cloudinary n'est pas configuré, sans rien enregistrer", async () => {
    const form = new FormData();
    form.append("title", "Avec image");
    form.append("content", "x");
    form.append("image", new Blob([Buffer.from("fake")], { type: "image/png" }), "a.png");
    const res = await author.post("/posts", form);
    assert.equal(res.status, 503);
    assert.equal((await guest.get("/posts?q=Avec image")).data.total, 0);
  });

  it("ne laisse modifier ou supprimer que ses propres articles", async () => {
    assert.equal((await other.patch(`/posts/${publicPost._id}`, { title: "hack" })).status, 403);
    assert.equal((await other.delete(`/posts/${publicPost._id}`)).status, 403);
    const res = await author.patch(`/posts/${publicPost._id}`, { content: "Nouveau #design" });
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.post.tags, ["design"]);
    assert.equal((await author.patch(`/posts/${publicPost._id}`, { visibility: "secret" })).status, 400);
  });
});

describe("paragraphes", () => {
  const youtube = {
    type: "video",
    provider: "youtube",
    url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    link: "https://youtu.be/dQw4w9WgXcQ",
  };

  it("restent facultatifs", () => {
    assert.deepEqual(publicPost.paragraphs, []);
  });

  it("lit et modifie les publications enregistrées avant les paragraphes", async () => {
    const now = new Date();
    const { insertedId } = await mongoose.connection.collection("posts").insertOne({
      author: new mongoose.Types.ObjectId(author.user._id),
      title: "Ancienne",
      content: "Publiée avant les paragraphes",
      category: "Autre",
      tags: [],
      visibility: "public",
      likes: [],
      saves: [],
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    const id = insertedId.toString();

    const read = await guest.get(`/posts/${id}`);
    assert.equal(read.status, 200);
    assert.deepEqual(read.data.post.paragraphs, []);
    for (const sort of ["recent", "popular"]) {
      const list = await guest.get(`/posts?q=Ancienne&sort=${sort}`);
      assert.deepEqual(list.data.posts.map((p) => [p._id, p.paragraphs]), [[id, []]], sort);
    }

    const edited = await author.patch(`/posts/${id}`, { title: "Ancienne modifiée" });
    assert.equal(edited.status, 200);
    assert.deepEqual(edited.data.post.paragraphs, []);
    const added = await author.patch(`/posts/${id}`, { paragraphs: [{ title: "Ajout" }] });
    assert.deepEqual(added.data.post.paragraphs, [{ title: "Ajout", description: "", media: null }]);
    assert.equal((await author.delete(`/posts/${id}`)).status, 200);
  });

  it("ont un titre, une description et une vidéo d'une autre plateforme", async () => {
    const res = await author.post("/posts", {
      title: "Carnet",
      content: "Intro",
      paragraphs: [
        { title: "Belvedere", description: "Vue sur le fleuve #lisbonne" },
        { title: "Le film", media: { link: "https://youtu.be/dQw4w9WgXcQ" } },
      ],
    });
    assert.equal(res.status, 201);
    const { post } = res.data;
    assert.deepEqual(post.paragraphs, [
      { title: "Belvedere", description: "Vue sur le fleuve #lisbonne", media: null },
      { title: "Le film", description: "", media: youtube },
    ]);
    assert.deepEqual(post.tags, ["lisbonne"]);
    assert.equal((await guest.get("/posts?q=belvedere")).data.total, 1);
    assert.equal((await guest.get("/posts?tag=lisbonne")).data.total, 1);
    assert.deepEqual((await guest.get(`/posts/${post._id}`)).data.post.paragraphs, post.paragraphs);
    await author.delete(`/posts/${post._id}`);
  });

  it("se gardent, se réordonnent et se retirent en modification", async () => {
    const { post } = (
      await author.post("/posts", {
        title: "Modif",
        content: "c",
        paragraphs: [{ title: "A", media: { link: "https://vimeo.com/76979871" } }, { title: "B" }],
      })
    ).data;
    const vimeo = post.paragraphs[0].media;
    assert.deepEqual(vimeo, {
      type: "video",
      provider: "vimeo",
      url: "https://player.vimeo.com/video/76979871",
      link: "https://vimeo.com/76979871",
    });

    const form = new FormData();
    form.append("paragraphs", JSON.stringify([{ title: "B" }, { title: "A bis", media: { url: vimeo.url } }]));
    let res = await author.patch(`/posts/${post._id}`, form);
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.data.post.paragraphs.map((p) => [p.title, p.media]),
      [["B", null], ["A bis", vimeo]]
    );

    res = await author.patch(`/posts/${post._id}`, { title: "Modif 2" });
    assert.equal(res.data.post.paragraphs.length, 2);

    res = await author.patch(`/posts/${post._id}`, { paragraphs: [] });
    assert.deepEqual(res.data.post.paragraphs, []);
    await author.delete(`/posts/${post._id}`);
  });

  it("refusent les données invalides en désignant le champ en cause", async () => {
    const cases = [
      [[{ description: "sans titre" }], "paragraphs.0.title"],
      [[{ title: "a" }, { title: { $ne: 1 } }], "paragraphs.1.title"],
      [[{ title: "a", description: ["x"] }], "paragraphs.0.description"],
      [[{ title: "a", media: { link: "javascript:alert(1)" } }], "paragraphs.0.media"],
      [[{ title: "a", media: { link: "data:image/png;base64,AAAA" } }], "paragraphs.0.media"],
      [[{ title: "a", media: { link: "https://exemple.fr/a.png", type: "pdf" } }], "paragraphs.0.media"],
      [[{ title: "a", media: { url: "https://res.cloudinary.com/autre/image/upload/a.png" } }], "paragraphs.0.media"],
      [[{ title: "a", media: { file: 0 } }], "paragraphs.0.media"],
      [[{ title: "a".repeat(151) }], "paragraphs.0.title"],
      [Array.from({ length: 21 }, () => ({ title: "a" })), "paragraphs"],
      ["pas une liste", "paragraphs"],
      [[null], "paragraphs"],
    ];
    for (const [paragraphs, field] of cases) {
      const res = await author.post("/posts", { title: "Invalide", content: "c", paragraphs });
      assert.equal(res.status, 400, field);
      assert.equal(res.data.field, field);
    }
    const form = new FormData();
    form.append("title", "Invalide");
    form.append("content", "c");
    form.append("paragraphs", "{oops");
    assert.equal((await author.post("/posts", form)).status, 400);
    assert.equal((await guest.get("/posts?q=Invalide")).data.total, 0);
  });

  it("envoient les fichiers sur Cloudinary et n'enregistrent rien quand il n'est pas configuré", async () => {
    const form = new FormData();
    form.append("title", "Avec média");
    form.append("content", "x");
    form.append("paragraphs", JSON.stringify([{ title: "Clip", media: { file: 0 } }]));
    form.append("media", new Blob([Buffer.from("fake")], { type: "video/mp4" }), "clip.mp4");
    assert.equal((await author.post("/posts", form)).status, 503);

    const link = await author.post("/posts", {
      title: "Avec média",
      content: "x",
      paragraphs: [{ title: "Photo", media: { link: "https://exemple.fr/photo.jpg", type: "image" } }],
    });
    assert.equal(link.status, 503);
    assert.equal((await guest.get("/posts?q=Avec média")).data.total, 0);
  });
});

describe("visibilité « abonnés »", () => {
  it("cache l'article, ses commentaires et ses actions aux non-abonnés", async () => {
    const list = await guest.get("/posts");
    assert.ok(!list.data.posts.some((p) => p._id === privatePost._id));
    assert.equal((await guest.get(`/posts/${privatePost._id}`)).status, 403);
    assert.equal((await guest.get(`/posts/${privatePost._id}/comments`)).status, 403);
    assert.equal((await reader.post(`/posts/${privatePost._id}/comments`, { content: "salut" })).status, 403);
    assert.equal((await reader.post(`/posts/${privatePost._id}/like`)).status, 403);
  });

  it("l'ouvre aux abonnés", async () => {
    await reader.post(`/users/${author.user._id}/follow`);
    assert.equal((await reader.get(`/posts/${privatePost._id}`)).status, 200);
    assert.equal((await reader.post(`/posts/${privatePost._id}/comments`, { content: "merci" })).status, 201);
    const comments = await reader.get(`/posts/${privatePost._id}/comments`);
    assert.equal(comments.status, 200);
    assert.equal(comments.data.comments.length, 1);
    await reader.post(`/users/${author.user._id}/follow`);
  });
});

describe("likes, enregistrements et notifications", () => {
  it("bascule le like avec un compteur juste", async () => {
    const a = await reader.post(`/posts/${publicPost._id}/like`);
    assert.deepEqual(a.data, { active: true, count: 1 });
    const b = await reader.post(`/posts/${publicPost._id}/like`);
    assert.deepEqual(b.data, { active: false, count: 0 });
  });

  it("ne crée pas de notifications en double", async () => {
    for (let i = 0; i < 3; i++) await other.post(`/posts/${publicPost._id}/like`);
    const notifs = (await author.get("/notifications")).data.notifications.filter((n) => n.type === "like");
    assert.equal(notifs.length, 1);
    await other.post(`/posts/${publicPost._id}/like`);
    const after = (await author.get("/notifications")).data.notifications.filter((n) => n.type === "like");
    assert.equal(after.length, 0);
  });

  it("gère les likes simultanés", async () => {
    const users = await Promise.all(["fan1", "fan2", "fan3", "fan4", "fan5"].map((u) => signup(u)));
    await Promise.all(users.map((u) => u.post(`/posts/${publicPost._id}/like`)));
    assert.equal((await guest.get(`/posts/${publicPost._id}`)).data.post.likesCount, 5);
  });

  it("trie les populaires en comptant les likes", async () => {
    const quiet = (await author.post("/posts", { title: "Calme", content: "rien" })).data.post;
    const res = await guest.get("/posts?sort=popular");
    assert.equal(res.data.posts[0]._id, publicPost._id);
    assert.ok(res.data.posts.some((p) => p._id === quiet._id));
    assert.equal(res.data.posts[0].author.username, "auteur");
  });

  it("liste les enregistrements, réservés aux membres", async () => {
    await reader.post(`/posts/${publicPost._id}/save`);
    assert.equal((await reader.get("/posts?saved=true")).data.total, 1);
    assert.equal((await guest.get("/posts?saved=true")).status, 401);
  });

  it("retire la notification de suivi au désabonnement", async () => {
    await other.post(`/users/${reader.user._id}/follow`);
    let follows = (await reader.get("/notifications")).data.notifications.filter((n) => n.type === "follow");
    assert.equal(follows.length, 1);
    await other.post(`/users/${reader.user._id}/follow`);
    follows = (await reader.get("/notifications")).data.notifications.filter((n) => n.type === "follow");
    assert.equal(follows.length, 0);
    assert.equal((await other.post(`/users/${other.user._id}/follow`)).status, 400);
  });
});

describe("commentaires", () => {
  it("met à jour le compteur et respecte les droits de suppression", async () => {
    const c = (await reader.post(`/posts/${publicPost._id}/comments`, { content: "Top" })).data.comment;
    assert.equal((await guest.get(`/posts/${publicPost._id}`)).data.post.commentsCount, 1);
    assert.equal((await other.delete(`/comments/${c._id}`)).status, 403);
    assert.equal((await author.delete(`/comments/${c._id}`)).status, 200);
    assert.equal((await guest.get(`/posts/${publicPost._id}`)).data.post.commentsCount, 0);
    assert.equal((await reader.post(`/posts/${publicPost._id}/comments`, { content: "   " })).status, 400);
  });

  it("répond à un commentaire sur un seul niveau et prévient la bonne personne", async () => {
    const root = (await reader.post(`/posts/${publicPost._id}/comments`, { content: "Question ?" })).data.comment;
    assert.equal(root.parent, null);
    assert.equal(root.repliesCount, 0);

    const first = await author.post(`/posts/${publicPost._id}/comments`, { content: "Réponse", parent: root._id });
    assert.equal(first.status, 201);
    assert.equal(first.data.comment.parent, root._id);
    assert.equal(first.data.comment.replyTo.username, "lecteur");
    // Réponse à une réponse : même fil, adressée à l'auteur de la réponse.
    const second = (await other.post(`/posts/${publicPost._id}/comments`, { content: "Moi aussi", parent: first.data.comment._id }))
      .data.comment;
    assert.equal(second.parent, root._id);
    assert.equal(second.replyTo.username, "auteur");

    const list = (await guest.get(`/posts/${publicPost._id}/comments`)).data.comments;
    assert.deepEqual(list.map((c) => [c.content, c.repliesCount]), [["Question ?", 2]]);
    const replies = (await guest.get(`/comments/${root._id}/replies`)).data.replies;
    assert.deepEqual(replies.map((r) => [r.content, r.replyTo.username]), [["Réponse", "lecteur"], ["Moi aussi", "auteur"]]);
    assert.equal((await guest.get(`/posts/${publicPost._id}`)).data.post.commentsCount, 3);

    const readerNotifs = (await reader.get("/notifications?type=comment")).data.notifications;
    assert.ok(readerNotifs.some((n) => n.type === "reply" && n.comment.content === "Réponse"));
    const authorNotifs = (await author.get("/notifications?type=comment")).data.notifications;
    assert.ok(authorNotifs.some((n) => n.type === "comment" && n.comment.content === "Question ?"));
    // L'auteur de l'article est aussi celui à qui l'on répond : une seule notification.
    assert.deepEqual(authorNotifs.filter((n) => n.comment?.content === "Moi aussi").map((n) => n.type), ["reply"]);

    assert.equal((await reader.post(`/posts/${publicPost._id}/comments`, { content: "x", parent: { $ne: null } })).status, 400);
    assert.equal((await reader.post(`/posts/${publicPost._id}/comments`, { content: "x", parent: "pas-un-id" })).status, 400);
    const elsewhere = (await author.post("/posts", { title: "Ailleurs", content: "y" })).data.post;
    assert.equal((await reader.post(`/posts/${elsewhere._id}/comments`, { content: "x", parent: root._id })).status, 404);
    await author.delete(`/posts/${elsewhere._id}`);

    // Supprimer une réponse décompte le fil ; supprimer le commentaire emporte ses réponses et leurs notifications.
    assert.equal((await author.delete(`/comments/${first.data.comment._id}`)).data.removed, 1);
    assert.equal((await guest.get(`/posts/${publicPost._id}/comments`)).data.comments[0].repliesCount, 1);
    assert.equal((await reader.delete(`/comments/${root._id}`)).data.removed, 2);
    assert.equal((await guest.get(`/comments/${root._id}/replies`)).status, 404);
    assert.equal((await guest.get(`/posts/${publicPost._id}`)).data.post.commentsCount, 0);
    const left = (await author.get("/notifications?type=comment")).data.notifications;
    assert.equal(left.filter((n) => ["Question ?", "Moi aussi"].includes(n.comment?.content)).length, 0);
  });

  it("cache les réponses d'une publication réservée aux abonnés", async () => {
    const c = (await author.post(`/posts/${privatePost._id}/comments`, { content: "Note" })).data.comment;
    assert.equal((await guest.get(`/comments/${c._id}/replies`)).status, 403);
    assert.equal((await author.get(`/comments/${c._id}/replies`)).status, 200);
    await author.delete(`/comments/${c._id}`);
  });
});

describe("notifications", () => {
  it("filtre par type, pagine, montre le commentaire et oublie un commentaire supprimé", async () => {
    const owner = await signup("notif_auteur", "author");
    const fan = await signup("notif_fan");
    const post = (await owner.post("/posts", { title: "Notifs", content: "x" })).data.post;
    await fan.post(`/posts/${post._id}/like`);
    const first = (await fan.post(`/posts/${post._id}/comments`, { content: "Premier commentaire" })).data.comment;
    await fan.post(`/posts/${post._id}/comments`, { content: "Deuxième" });
    await fan.post(`/users/${owner.user._id}/follow`);

    const all = (await owner.get("/notifications")).data;
    assert.deepEqual(all.notifications.map((n) => n.type), ["follow", "comment", "comment", "like"]);
    assert.equal(all.notifications[1].comment.content, "Deuxième");
    assert.equal(all.notifications[0].comment, null);
    assert.equal(all.unread, 4);
    assert.deepEqual([all.page, all.pages, all.total], [1, 1, 4]);

    const comments = (await owner.get("/notifications?type=comment")).data.notifications;
    assert.deepEqual(comments.map((n) => n.comment.content), ["Deuxième", "Premier commentaire"]);

    const page1 = (await owner.get("/notifications?limit=3")).data;
    assert.equal(page1.notifications.length, 3);
    assert.deepEqual([page1.page, page1.pages, page1.total], [1, 2, 4]);
    const page2 = (await owner.get("/notifications?limit=3&page=2")).data;
    assert.deepEqual(page2.notifications.map((n) => n.type), ["like"]);
    assert.equal(page2.page, 2);
    assert.deepEqual((await owner.get("/notifications?type=comment&limit=1")).data.pages, 2);

    assert.equal((await owner.get("/notifications?type=autre")).status, 400);

    await fan.delete(`/comments/${first._id}`);
    const left = (await owner.get("/notifications?type=comment")).data.notifications;
    assert.deepEqual(left.map((n) => n.comment.content), ["Deuxième"]);
    await owner.delete(`/posts/${post._id}`);
  });
});

describe("profil", () => {
  it("valide le site web et refuse les champs non textuels", async () => {
    assert.equal((await reader.patch("/users/me", { website: "pas-une-url" })).status, 400);
    assert.equal((await reader.patch("/users/me", { bio: { a: 1 } })).status, 400);
    const ok = await reader.patch("/users/me", { location: "Kinshasa", website: "https://solola.dev" });
    assert.equal(ok.data.user.location, "Kinshasa");
  });

  it("ne modifie rien si l'envoi d'avatar échoue", async () => {
    const form = new FormData();
    form.append("name", "Nouveau nom");
    form.append("avatar", new Blob([Buffer.from("fake")], { type: "image/png" }), "a.png");
    assert.equal((await reader.patch("/users/me", form)).status, 503);
    assert.equal((await guest.get("/users/lecteur")).data.user.name, "lecteur");
  });

  it("liste abonnés et abonnements", async () => {
    await other.post(`/users/${author.user._id}/follow`);
    const res = await reader.get("/users/auteur/followers");
    assert.deepEqual(res.data.users.map((u) => u.username), ["autre"]);
  });

  it("ne montre comme abonnés que les comptes qui suivent vraiment, même si les données ont divergé", async () => {
    const users = mongoose.connection.collection("users");
    // Copie `followers` désaccordée : « lecteur » y figure sans suivre « auteur ».
    await users.updateOne({ username: "auteur" }, { $addToSet: { followers: new mongoose.Types.ObjectId(reader.user._id) } });
    try {
      assert.deepEqual((await guest.get("/users/auteur/followers")).data.users.map((u) => u.username), ["autre"]);
      const profile = (await reader.get("/users/auteur")).data.user;
      assert.equal(profile.followersCount, 1);
      assert.equal(profile.isFollowing, false);
    } finally {
      await users.updateOne({ username: "auteur" }, { $pull: { followers: new mongoose.Types.ObjectId(reader.user._id) } });
    }
  });

  it("indique, pour chaque compte d'une liste, si on le suit et s'il nous suit", async () => {
    let seen = await other.get("/users/autre/following");
    assert.deepEqual(seen.data.users.map((u) => [u.username, u.isFollowing, u.followsYou, u.isMe]), [["auteur", true, false, false]]);
    await author.post(`/users/${other.user._id}/follow`);
    seen = await other.get("/users/autre/following");
    assert.deepEqual(seen.data.users.map((u) => [u.username, u.followsYou]), [["auteur", true]]);
    assert.deepEqual((await other.get("/users/auteur/followers")).data.users.map((u) => [u.username, u.isMe]), [["autre", true]]);
    await author.post(`/users/${other.user._id}/follow`);
  });

  it("remet d'accord les listes d'abonnés avec pnpm repair:follows", async () => {
    const users = mongoose.connection.collection("users");
    await users.updateOne({ username: "auteur" }, { $addToSet: { followers: new mongoose.Types.ObjectId(reader.user._id) } });
    const out = execFileSync(process.execPath, ["scripts/repair-follows.js"], {
      cwd: path.join(__dirname, ".."),
      env: process.env,
      encoding: "utf8",
    });
    assert.match(out, /corrigée/);
    const doc = await users.findOne({ username: "auteur" });
    assert.deepEqual(doc.followers.map(String), [other.user._id]);
  });

  it("change le mot de passe et invalide les anciennes sessions", async () => {
    const c = await signup("change");
    const stale = client();
    stale.cookie = c.cookie;
    const wrong = await c.patch("/users/me/password", { currentPassword: "faux", newPassword: "secret2" });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.data.field, "currentPassword");
    const short = await c.patch("/users/me/password", { currentPassword: "secret1", newPassword: "1234" });
    assert.equal(short.status, 400);
    assert.equal(short.data.field, "newPassword");
    await new Promise((r) => setTimeout(r, 1100));
    assert.equal((await c.patch("/users/me/password", { currentPassword: "secret1", newPassword: "secret2" })).status, 200);
    assert.equal((await c.get("/auth/session")).data.user?.username, "change");
    assert.equal((await stale.get("/auth/session")).data.user, null);
  });
});

describe("récupération de compte par OTP", () => {
  it("répond pareil pour un email inconnu", async () => {
    const res = await guest.post("/auth/forgot-password", { email: "inconnu@test.dev" });
    assert.equal(res.status, 200);
  });

  it("bloque après 5 mauvais codes", async () => {
    await guest.post("/auth/forgot-password", { email: "autre@test.dev" });
    const code = lastOtp("autre@test.dev");
    const wrong = code === "000000" ? "111111" : "000000";
    const results = await Promise.all(
      Array.from({ length: 7 }, () => guest.post("/auth/verify-otp", { email: "autre@test.dev", code: wrong }))
    );
    assert.equal(results.filter((r) => r.data.message?.startsWith("Code incorrect")).length, 5);
    const res = await guest.post("/auth/verify-otp", { email: "autre@test.dev", code });
    assert.notEqual(res.status, 200);
  });

  it("réinitialise le mot de passe, une seule fois, et coupe les anciennes sessions", async () => {
    const victim = await signup("victime");
    const oldSession = client();
    oldSession.cookie = victim.cookie;

    await guest.post("/auth/forgot-password", { email: "victime@test.dev" });
    const code = lastOtp("victime@test.dev");
    assert.match(code, /^\d{6}$/);

    const verified = await guest.post("/auth/verify-otp", { email: "victime@test.dev", code });
    assert.equal(verified.status, 200);
    const { resetToken } = verified.data;

    await new Promise((r) => setTimeout(r, 1100));
    const c = client();
    const reset = await c.post("/auth/reset-password", { email: "victime@test.dev", resetToken, password: "nouveau1" });
    assert.equal(reset.status, 200);
    assert.equal((await c.get("/auth/session")).data.user.username, "victime");

    const again = await client().post("/auth/reset-password", { email: "victime@test.dev", resetToken, password: "encore1" });
    assert.equal(again.status, 400);

    assert.equal((await oldSession.get("/auth/session")).data.user, null);
    assert.equal((await client().post("/auth/login", { identifier: "victime", password: "secret1" })).status, 401);
    assert.equal((await client().post("/auth/login", { identifier: "victime", password: "nouveau1" })).status, 200);
  });

  it("signale l'échec d'envoi du mail et n'enregistre pas de code", async () => {
    mailer.failNext = true;
    const res = await guest.post("/auth/forgot-password", { email: "lecteur@test.dev" });
    assert.equal(res.status, 502);
    const verify = await guest.post("/auth/verify-otp", { email: "lecteur@test.dev", code: "123456" });
    assert.equal(verify.data.message, "Code expiré, demande-en un nouveau");
  });

  it("n'annonce pas d'envoi en production quand SMTP n'est pas configuré, compte connu ou non", async () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      for (const email of ["lecteur@test.dev", "inconnu@test.dev"]) {
        const res = await guest.post("/auth/forgot-password", { email });
        assert.equal(res.status, 503, email);
        assert.equal(res.data.message, "L'envoi d'emails n'est pas configuré sur le serveur, réessaie plus tard");
      }
    } finally {
      process.env.NODE_ENV = env;
    }
    const verify = await guest.post("/auth/verify-otp", { email: "lecteur@test.dev", code: "123456" });
    assert.equal(verify.data.message, "Code expiré, demande-en un nouveau");
  });
});
