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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = { text, optionalText, positiveInt, EMAIL_RE };
