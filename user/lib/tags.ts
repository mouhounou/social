export const MAX_TAGS = 7;
export const MAX_TAG_LENGTH = 30;

const HASHTAG_RE = /#([\p{L}0-9_]+)/gu;

/** Découpe une saisie libre (« #Art, aquarelle ») en tags propres. */
export function parseTags(input: string): string[] {
  return input
    .split(/[\s,#]+/)
    .map((t) => t.replace(/[^\p{L}0-9_]/gu, "").toLowerCase().slice(0, MAX_TAG_LENGTH))
    .filter(Boolean);
}

export function contentTags(content: string): string[] {
  return [...content.matchAll(HASHTAG_RE)].map((m) => m[1].toLowerCase());
}

/** Tags ajoutés à la main, c'est-à-dire ceux qui ne sont pas déjà écrits dans le texte. */
export function extraTags(tags: string[], content: string): string[] {
  const inContent = new Set(contentTags(content));
  return tags.filter((t) => !inContent.has(t));
}
