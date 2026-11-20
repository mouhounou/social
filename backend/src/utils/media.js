// Médias des paragraphes : limites, formats acceptés et liens vers d'autres plateformes.

const MAX_PARAGRAPHS = 20;
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const LINK_MAX = 2048;

// Seuls les liens http(s) passent : l'hébergeur d'images accepte aussi data:, s3:, gs:...,
// qui permettraient d'envoyer un fichier sans limite de taille ou de lire un stockage privé.
function parseLink(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > LINK_MAX) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  return url;
}

function youtube(url, host) {
  let id;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1];
  } else if (["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"].includes(host)) {
    id = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/]+)/)?.[1];
  }
  return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

function vimeo(url, host) {
  let id;
  let hash;
  if (host === "player.vimeo.com") {
    id = url.pathname.match(/^\/video\/(\d+)\/?$/)?.[1];
    hash = url.searchParams.get("h");
  } else if (host === "vimeo.com") {
    // vimeo.com/123456, vimeo.com/123456/abcdef (vidéo non répertoriée), vimeo.com/channels/x/123456...
    const m = url.pathname.match(/\/(\d+)(?:\/([\da-f]+))?\/?$/);
    [, id, hash] = m || [];
  }
  if (!id) return null;
  const h = hash && /^[\da-f]{6,20}$/.test(hash) ? `?h=${hash}` : "";
  return `https://player.vimeo.com/video/${id}${h}`;
}

function dailymotion(url, host) {
  let id;
  if (host === "dai.ly") id = url.pathname.split("/")[1];
  else if (host === "dailymotion.com") id = url.pathname.match(/^\/(?:embed\/)?video\/([^/_]+)/)?.[1];
  else if (host === "geo.dailymotion.com") id = url.searchParams.get("video");
  return id && /^x[a-z0-9]{3,15}$/i.test(id) ? `https://www.dailymotion.com/embed/video/${id}` : null;
}

const PLATFORMS = { youtube, vimeo, dailymotion };

/** Lecteur intégré d'une vidéo YouTube, Vimeo ou Dailymotion ; null pour un autre lien. */
function videoEmbed(link) {
  const url = typeof link === "string" ? parseLink(link) : link;
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  for (const [provider, parse] of Object.entries(PLATFORMS)) {
    const embed = parse(url, host);
    if (embed) return { provider, url: embed };
  }
  return null;
}

module.exports = {
  MAX_PARAGRAPHS,
  IMAGE_MAX,
  VIDEO_MAX,
  IMAGE_TYPES,
  VIDEO_TYPES,
  parseLink,
  videoEmbed,
};
