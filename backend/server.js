require("dotenv").config({ quiet: true });

const app = require("./src/app");
const connectDB = require("./src/config/db");
const turnstile = require("./src/middlewares/turnstile");
const mailer = require("./src/config/mailer");

const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Variables manquantes dans .env : ${missing.join(", ")}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === "production") {
    console.error("JWT_SECRET doit faire au moins 32 caractères en production");
    process.exit(1);
  }
  console.warn("JWT_SECRET est court : utilise au moins 32 caractères aléatoires");
}

if (turnstile.enabled() && !turnstile.allowedHostnames().size) {
  console.error("TURNSTILE_HOSTNAMES est requis avec TURNSTILE_SECRET : indique le domaine du site (ex. solola.app)");
  process.exit(1);
}
if (!turnstile.enabled() && process.env.NODE_ENV === "production") {
  console.warn("TURNSTILE_SECRET est absent : la protection anti-robots est inactive");
}

// Les emails (codes de récupération) : on vérifie la connexion SMTP dès le démarrage, sans le bloquer.
if (mailer.configured()) {
  const { host, port } = mailer.settings();
  mailer
    .verify()
    .then(() => console.log(`Emails : SMTP prêt (${host}:${port})`))
    .catch((err) => console.error(`Emails : ${mailer.explain(err)} Teste avec : pnpm mail:test ton@email.fr`));
} else if (process.env.NODE_ENV === "production") {
  console.warn("SMTP_USER est absent : les codes de récupération de compte ne peuvent pas être envoyés");
} else {
  console.log("Emails : SMTP non configuré, les codes OTP s'affichent dans cette console");
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API Solola sur http://localhost:${PORT}`));
});
