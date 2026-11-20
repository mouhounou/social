// Médias des paragraphes : mêmes limites et mêmes plateformes que l'API (backend/src/utils/media.js).

export const MAX_PARAGRAPHS = 20;
export const IMAGE_MAX = 5 * 1024 * 1024;
export const VIDEO_MAX = 50 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const MEDIA_ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES].join(",");

export const PROVIDER_NAMES = { youtube: "YouTube", vimeo: "Vimeo", dailymotion: "Dailymotion" } as const;
export type VideoProvider = keyof typeof PROVIDER_NAMES;

export function parseLink(value: string): URL | null {
  const raw = value.trim();
  if (!raw || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function youtube(url: URL, host: string) {
  let id: string | null | undefined;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"].includes(host)) {
    id = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/]+)/)?.[1];
  }
  return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

function vimeo(url: URL, host: string) {
  let id: string | undefined;
  let hash: string | null | undefined;
  if (host === "player.vimeo.com") {
    id = url.pathname.match(/^\/video\/(\d+)\/?$/)?.[1];
    hash = url.searchParams.get("h");
  } else if (host === "vimeo.com") {
    [, id, hash] = url.pathname.match(/\/(\d+)(?:\/([\da-f]+))?\/?$/) ?? [];
  }
  if (!id) return null;
  return `https://player.vimeo.com/video/${id}${hash && /^[\da-f]{6,20}$/.test(hash) ? `?h=${hash}` : ""}`;
}

function dailymotion(url: URL, host: string) {
  let id: string | null | undefined;
  if (host === "dai.ly") id = url.pathname.split("/")[1];
  else if (host === "dailymotion.com") id = url.pathname.match(/^\/(?:embed\/)?video\/([^/_]+)/)?.[1];
  else if (host === "geo.dailymotion.com") id = url.searchParams.get("video");
  return id && /^x[a-z0-9]{3,15}$/i.test(id) ? `https://www.dailymotion.com/embed/video/${id}` : null;
}

const PLATFORMS = { youtube, vimeo, dailymotion };

/** Lecteur intégré d'une vidéo YouTube, Vimeo ou Dailymotion ; null pour un autre lien. */
export function videoEmbed(link: string): { provider: VideoProvider; url: string } | null {
  const url = parseLink(link);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  for (const provider of Object.keys(PLATFORMS) as VideoProvider[]) {
    const embed = PLATFORMS[provider](url, host);
    if (embed) return { provider, url: embed };
  }
  return null;
}

export function mediaKind(file: File): "image" | "video" | null {
  if (IMAGE_TYPES.includes(file.type)) return "image";
  if (VIDEO_TYPES.includes(file.type)) return "video";
  return null;
}

/** Message d'erreur pour un fichier refusé d'avance, null s'il est accepté. */
export function checkMediaFile(file: File): string | null {
  const kind = mediaKind(file);
  if (!kind) return "Format non accepté : image JPEG, PNG, WebP, GIF, AVIF ou vidéo MP4, WebM, MOV";
  if (kind === "image" && file.size > IMAGE_MAX) return "Image trop lourde (5 Mo max)";
  if (kind === "video" && file.size > VIDEO_MAX) return "Vidéo trop lourde (50 Mo max)";
  return null;
}

export function hostname(link: string): string {
  return parseLink(link)?.hostname.replace(/^www\./, "") ?? link;
}
