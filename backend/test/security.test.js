const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { start, stop, client, signup, sentMails } = require("./helpers");

let author;

before(async () => {
  await start();
  author = await signup("secu_auteur", "author");
});

after(stop);

function withEnv(vars, fn) {
  const saved = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  Object.assign(process.env, vars);
  return fn().finally(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
}

describe("en-têtes HTTP", () => {
  it("ne révèle pas Express et envoie les en-têtes de sécurité", async () => {
    const res = await fetch(client().baseUrl + "/health");
    assert.equal(res.headers.get("x-powered-by"), null);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.ok(res.headers.get("content-security-policy"));
    assert.ok(res.headers.get("strict-transport-security"));
  });
});

describe("emails", () => {
  it("échappe le nom de l'utilisateur dans le HTML", async () => {
    const c = client();
    const name = '<a href="https://pirate.test">Clique ici</a>';
    await c.post("/auth/register", { name, username: "secu_html", email: "secu_html@test.dev", password: "secret1" });
    const mail = sentMails.find((m) => m.to === "secu_html@test.dev");
    assert.ok(mail);
    assert.ok(!mail.html.includes("<a href"));
    assert.ok(mail.html.includes("&lt;a href=&quot;https://pirate.test&quot;&gt;"));
  });
});

describe("jetons", () => {
  it("refuse un jeton sans signature (alg none) ou signé avec une autre clé", async () => {
    const forged = [
      jwt.sign({ id: author.user._id, role: "admin" }, null, { algorithm: "none" }),
      jwt.sign({ id: author.user._id, role: "admin" }, "pas-la-bonne-cle"),
    ];
    for (const token of forged) {
      const res = await client().get("/auth/session", { Authorization: `Bearer ${token}` });
      assert.equal(res.data.user, null);
    }
  });
});

describe("envoi d'images", () => {
  it("refuse le SVG et les types non image", async () => {
    for (const [type, name] of [["image/svg+xml", "x.svg"], ["text/html", "x.html"]]) {
      const form = new FormData();
      form.append("title", "t");
      form.append("content", "c");
      form.append("image", new Blob(["<svg onload=alert(1)>"], { type }), name);
      const res = await author.post("/posts", form);
      assert.equal(res.status, 400, type);
    }
  });
});

describe("connexion", () => {
  it("met autant de temps pour un compte inexistant que pour un mauvais mot de passe", async () => {
    const time = async (identifier) => {
      const t = performance.now();
      await client().post("/auth/login", { identifier, password: "mauvais" });
      return performance.now() - t;
    };
    let known = 0;
    let unknown = 0;
    for (let i = 0; i < 3; i++) {
      known += await time("secu_auteur");
      unknown += await time("personne_inconnue");
    }
    assert.ok(unknown > known * 0.5, `inconnu ${unknown.toFixed(0)} ms, connu ${known.toFixed(0)} ms`);
  });
});

describe("limites anti-abus", () => {
  it("limite les codes OTP par email, même depuis plusieurs adresses IP", () =>
    withEnv({ RATE_LIMIT: "on" }, async () => {
      const statuses = [];
      for (let i = 1; i <= 4; i++) {
        const res = await client().post("/auth/forgot-password", { email: "secu_auteur@test.dev" }, { "X-Forwarded-For": `203.0.113.${i}` });
        statuses.push(res.status);
      }
      assert.deepEqual(statuses, [200, 200, 200, 429]);
      const other = await client().post("/auth/forgot-password", { email: "autre@test.dev" }, { "X-Forwarded-For": "203.0.113.50" });
      assert.equal(other.status, 200);
    }));

  it("bloque un compte après 10 mots de passe faux, même depuis plusieurs adresses IP", () =>
    withEnv({ RATE_LIMIT: "on" }, async () => {
      const statuses = [];
      for (let i = 1; i <= 11; i++) {
        const res = await client().post("/auth/login", { identifier: "secu_auteur", password: "faux" }, { "X-Forwarded-For": `198.51.100.${i}` });
        statuses.push(res.status);
      }
      assert.equal(statuses.filter((s) => s === 401).length, 10);
      assert.equal(statuses.at(-1), 429);
    }));
});

describe("hors développement", () => {
  for (const [label, env, n] of [["production", "production", 10], ["NODE_ENV absent", "", 20]]) {
    it(`${label} : cookie Secure et aucun code OTP dans les journaux`, async () => {
      const username = `secu_prod${n}`;
      await signup(username);
      await withEnv({ NODE_ENV: env }, async () => {
        const res = await fetch(client().baseUrl + "/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Forwarded-For": `192.0.2.${n}` },
          body: JSON.stringify({ identifier: username, password: "secret1" }),
        });
        assert.match(res.headers.get("set-cookie"), /;\s*Secure/i);

        const logs = [];
        const log = console.log;
        console.log = (...args) => logs.push(args.join(" "));
        try {
          await client().post("/auth/forgot-password", { email: `${username}@test.dev` }, { "X-Forwarded-For": `192.0.2.${n + 1}` });
        } finally {
          console.log = log;
        }
        assert.ok(!logs.some((l) => l.includes("OTP pour")));
      });
    });
  }
});
