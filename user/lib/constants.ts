export const CATEGORIES = [
  "Art et dessin",
  "Design",
  "Photographie",
  "Technologie",
  "Musique",
  "Voyage",
  "Lifestyle",
  "Manga",
  "Autre",
];

export const DEFAULT_AVATAR = "/default-avatar.svg";
export const DEFAULT_COVER = "/default-cover.svg";

// Clé publique du widget Cloudflare Turnstile (anti-robots). Hors production, c'est la clé de test
// de Cloudflare, toujours validée, qui sert : le vrai widget n'accepte que le domaine du site.
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (process.env.NODE_ENV === "production" ? "0x4AAAAAAGASeofkx1NCk77y" : "1x00000000000000000000AA");
