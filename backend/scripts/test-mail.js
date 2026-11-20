// Vérifie la configuration SMTP de .env et envoie un mail de test : pnpm mail:test ton@email.fr
require("dotenv").config({ quiet: true });
const mailer = require("../src/config/mailer");
const { EMAIL_RE } = require("../src/utils/input");

async function main() {
  const to = process.argv[2]?.trim();
  if (!to || !EMAIL_RE.test(to)) {
    console.error("Usage : pnpm mail:test ton@email.fr");
    process.exit(1);
  }

  const { host, port, secure, user, pass } = mailer.settings();
  const from = process.env.MAIL_FROM?.trim() || `Solola <${user}>`;
  console.log("Configuration lue dans .env :");
  console.log(`  SMTP_HOST  ${host || "(vide)"}`);
  console.log(`  SMTP_PORT  ${port}${secure ? " (TLS direct)" : " (STARTTLS)"}`);
  console.log(`  SMTP_USER  ${user || "(vide)"}`);
  console.log(`  SMTP_PASS  ${pass ? `renseigné (${pass.length} caractères)` : "(vide)"}`);
  console.log(`  MAIL_FROM  ${from}\n`);

  if (!mailer.configured()) {
    console.error("SMTP_USER est vide : l'API n'envoie aucun email (en développement, le code OTP s'affiche dans sa console).");
    process.exit(1);
  }
  const missing = [!host && "SMTP_HOST", !pass && "SMTP_PASS"].filter(Boolean);
  if (missing.length) console.warn(`Attention : ${missing.join(" et ")} vide(s).\n`);

  try {
    await mailer.verify();
    console.log("1/2 Connexion et identifiants acceptés par le serveur SMTP.");
    const info = await mailer.sendMail({
      to,
      subject: "Test d'envoi Solola",
      html: "<p>Si tu lis ce message, les codes de récupération de compte partiront bien.</p>",
    });
    console.log(`2/2 Mail accepté pour ${info.accepted.join(", ") || to} (${info.response}).`);
    console.log("\nS'il n'arrive pas dans quelques minutes, regarde les spams, puis vérifie MAIL_FROM.");
  } catch (err) {
    console.error(`Échec : ${mailer.explain(err)}`);
    process.exit(1);
  }
}

main();
