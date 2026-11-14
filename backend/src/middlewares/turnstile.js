const AppError = require("../utils/AppError");

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TOKEN_FIELD = "cf-turnstile-response";

const enabled = () => Boolean(process.env.TURNSTILE_SECRET);

function allowedHostnames() {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean)
  );
}

function refuse(reason) {
  if (reason) console.warn(`Turnstile : requête refusée (${reason})`);
  return new AppError("La vérification anti-robot n'a pas abouti. Réessaie dans un instant.", 403, "turnstile");
}

// Les clés de test de Cloudflare ne renvoient ni action ni vrai nom de domaine : tolérées hors production seulement.
const isTestKeyResult = (result) =>
  process.env.NODE_ENV !== "production" && result.metadata?.result_with_testing_key === true;

// Exige un jeton Turnstile valide, émis pour cette action et pour notre site, avant de laisser passer la requête.
// Sans TURNSTILE_SECRET, la protection est inactive.
function turnstile(action) {
  return async (req, res, next) => {
    if (!enabled()) return next();

    const token = req.body[TOKEN_FIELD];
    const hostnames = allowedHostnames();
    if (typeof token !== "string" || !token || token.length > 2048) throw refuse();
    if (!hostnames.size) throw refuse("TURNSTILE_HOSTNAMES est vide");

    let result;
    try {
      const response = await fetch(SITEVERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token, remoteip: req.ip }),
      });
      if (!response.ok) throw new Error(`siteverify ${response.status}`);
      result = await response.json();
    } catch (err) {
      throw refuse(`vérification injoignable : ${err.message}`);
    }

    if (!result.success) throw refuse((result["error-codes"] || []).join(", ") || "jeton invalide");
    if (!isTestKeyResult(result)) {
      if (result.action !== action) throw refuse(`action « ${result.action} » au lieu de « ${action} »`);
      if (!hostnames.has(result.hostname)) throw refuse(`domaine « ${result.hostname} » non autorisé`);
    }
    next();
  };
}

module.exports = { turnstile, enabled, allowedHostnames };
