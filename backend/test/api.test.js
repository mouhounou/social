const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
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
    const short = await guest.post("/auth/register", { name: "X", username: "xx_2", email: "x2@test.dev", password: "123" });
    assert.equal(short.status, 400);
    const long = await guest.post("/auth/register", { name: "X", username: "xx_3", email: "x3@test.dev", password: "a".repeat(80) });
    assert.equal(long.status, 400);
    const dup = await guest.post("/auth/register", { name: "X", username: "auteur", email: "x4@test.dev", password: "secret1" });
    assert.equal(dup.status, 409);
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

  it("change le mot de passe et invalide les anciennes sessions", async () => {
    const c = await signup("change");
    const stale = client();
    stale.cookie = c.cookie;
    assert.equal((await c.patch("/users/me/password", { currentPassword: "faux", newPassword: "secret2" })).status, 401);
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
});
