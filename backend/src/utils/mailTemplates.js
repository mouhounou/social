const { escapeHtml } = require("./html");

function otpEmail(name, code) {
  return `
  <div style="font-family:Poppins,Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f5f6f8;border-radius:16px">
    <h1 style="margin:0 0 24px;font-size:24px;color:#111">Solola</h1>
    <p style="color:#333">Bonjour ${escapeHtml(name)},</p>
    <p style="color:#333">Voici ton code pour récupérer ton compte :</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#1e90ff;margin:24px 0">${escapeHtml(code)}</p>
    <p style="color:#666;font-size:13px">Il expire dans 10 minutes. Si tu n'as rien demandé, ignore simplement cet email.</p>
  </div>`;
}

function welcomeEmail(name) {
  return `
  <div style="font-family:Poppins,Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f5f6f8;border-radius:16px">
    <h1 style="margin:0 0 24px;font-size:24px;color:#111">Bienvenue sur Solola</h1>
    <p style="color:#333">Salut ${escapeHtml(name)}, ton compte est prêt. Partage tes idées, commente, suis les gens qui t'inspirent.</p>
  </div>`;
}

module.exports = { otpEmail, welcomeEmail };
