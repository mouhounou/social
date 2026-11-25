function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value) {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value.trim() : null;
}

function positiveInt(value, fallback, max = Infinity) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

const MAX_TAGS = 7;
const TAG_RE = /^[\p{L}0-9_]{1,30}$/u;

// Accepte un tableau (JSON) ou une chaîne « art, #design » (multipart).
// undefined = champ absent, null = valeur invalide.
function tagList(value) {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\s,]+/) : null;
  if (!raw || raw.some((t) => typeof t !== "string")) return null;
  const tags = [...new Set(raw.map((t) => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))];
  return tags.every((t) => TAG_RE.test(t)) ? tags : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 5;

module.exports = { text, optionalText, positiveInt, tagList, MAX_TAGS, EMAIL_RE, PASSWORD_MIN };
