const nodemailer = require("nodemailer");

// Sans limite, un port SMTP bloqué fait attendre jusqu'à 2 minutes, bien après que le front a abandonné.
const TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };

function settings() {
  const host = process.env.SMTP_HOST?.trim() || "";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER?.trim() || "";
  let pass = process.env.SMTP_PASS ?? "";
  // Gmail affiche le mot de passe d'application en groupes de 4 lettres : les espaces n'en font pas partie.
  if (/(^|\.)(gmail|googlemail)\.com$/i.test(host)) pass = pass.replace(/\s+/g, "");
  return { host, port, secure: port === 465, user, pass };
}

/** Faux tant que SMTP_USER est vide : les mails sont alors seulement annoncés dans la console. */
function configured() {
  return Boolean(process.env.SMTP_USER?.trim());
}

let transporter;
function transport() {
  if (!transporter) {
    const { host, port, secure, user, pass } = settings();
    transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass }, ...TIMEOUTS });
  }
  return transporter;
}

// MAIL_FROM vide : « Solola <SMTP_USER> », une adresse que le compte SMTP a toujours le droit d'utiliser.
function sender() {
  return process.env.MAIL_FROM?.trim() || { name: "Solola", address: settings().user };
}

async function sendMail({ to, subject, html }) {
  if (!configured()) {
    console.log(`[mail non envoyé, SMTP non configuré] ${to} — ${subject}`);
    return null;
  }
  return transport().sendMail({ from: sender(), to, subject, html });
}

/** Vérifie la connexion et les identifiants SMTP, sans envoyer de mail. */
function verify() {
  return transport().verify();
}

/** Cause probable d'un échec d'envoi, et ce qu'il faut corriger. */
function explain(err) {
  const { host, port } = settings();
  const code = err?.responseCode;
  const reply = err?.response || err?.message;
  const detail = `(${[err?.code, !String(reply).startsWith(code) && code, reply].filter(Boolean).join(" ")})`;

  if (err?.code === "EAUTH" || code === 534 || code === 535) {
    return (
      `identifiants SMTP refusés ${detail}. Vérifie SMTP_USER et SMTP_PASS. Avec Gmail, SMTP_PASS doit être un ` +
      "mot de passe d'application (Compte Google > Sécurité > Validation en deux étapes > Mots de passe des " +
      "applications), pas le mot de passe du compte."
    );
  }
  if (["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED", "ENOTFOUND", "EDNS", "EAI_AGAIN"].includes(err?.code)) {
    return (
      `serveur SMTP injoignable sur ${host || "(SMTP_HOST vide)"}:${port} ${detail}. Vérifie SMTP_HOST et SMTP_PORT ` +
      "(587, ou 465). Certains hébergeurs bloquent les ports SMTP sortants : essaie l'autre port, le 2525 si ton " +
      "fournisseur d'emails le propose, ou un service d'envoi par API."
    );
  }
  if (err?.command === "MAIL FROM" || /sender|from address|send ?as/i.test(err?.response || "")) {
    return (
      `adresse d'expéditeur refusée ${detail}. MAIL_FROM doit être une adresse que ton compte SMTP a le droit ` +
      "d'utiliser (avec Gmail : ton adresse Gmail). Laisse MAIL_FROM vide pour utiliser SMTP_USER."
    );
  }
  if (err?.command === "RCPT TO") return `adresse du destinataire refusée par le serveur SMTP ${detail}.`;
  return `envoi refusé ${detail}.`;
}

module.exports = { sendMail, configured, verify, explain, settings, TIMEOUTS };
