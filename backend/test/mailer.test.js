const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"];

function load(env = {}) {
  for (const key of KEYS) delete process.env[key];
  Object.assign(process.env, env);
  delete require.cache[require.resolve("../src/config/mailer")];
  return require("../src/config/mailer");
}

describe("envoi des emails", () => {
  beforeEach(() => load());

  it("n'envoie rien sans SMTP_USER, et le dit dans la console", async () => {
    const mailer = load({ SMTP_HOST: "smtp.gmail.com" });
    assert.equal(mailer.configured(), false);
    const logs = [];
    const log = console.log;
    console.log = (line) => logs.push(line);
    try {
      assert.equal(await mailer.sendMail({ to: "a@b.fr", subject: "Ton code Solola", html: "x" }), null);
    } finally {
      console.log = log;
    }
    assert.match(logs.join("\n"), /SMTP non configuré.*a@b\.fr/);
  });

  it("retire les espaces du mot de passe d'application Gmail, et seulement pour Gmail", () => {
    assert.equal(load({ SMTP_HOST: "smtp.gmail.com", SMTP_PASS: "abcd efgh ijkl mnop" }).settings().pass, "abcdefghijklmnop");
    assert.equal(load({ SMTP_HOST: "smtp.exemple.fr", SMTP_PASS: "mot de passe" }).settings().pass, "mot de passe");
  });

  it("lit le port, et passe en TLS direct sur le 465", () => {
    assert.deepEqual(load({}).settings().port, 587);
    assert.equal(load({ SMTP_PORT: "465" }).settings().secure, true);
    assert.equal(load({ SMTP_PORT: "2525" }).settings().secure, false);
  });

  it("abandonne vite un serveur injoignable", () => {
    const { TIMEOUTS } = load();
    assert.ok(Object.values(TIMEOUTS).every((ms) => ms > 0 && ms <= 20_000));
  });

  it("explique les échecs courants", () => {
    const { explain } = load({ SMTP_HOST: "smtp.gmail.com", SMTP_PORT: "587" });
    assert.match(explain({ code: "EAUTH", responseCode: 535, response: "535 5.7.8 Username and Password not accepted" }), /mot de passe d'application/);
    assert.match(explain({ code: "ETIMEDOUT", message: "Greeting never received" }), /injoignable sur smtp\.gmail\.com:587/);
    assert.match(explain({ code: "ECONNREFUSED" }), /bloquent les ports SMTP/);
    assert.match(explain({ code: "EENVELOPE", command: "MAIL FROM", responseCode: 553 }), /MAIL_FROM/);
    assert.match(explain({ code: "EENVELOPE", command: "RCPT TO", responseCode: 550 }), /destinataire/);
    assert.doesNotMatch(explain({ code: "EAUTH", responseCode: 535, response: "535 refus" }), /535 535/);
  });
});
