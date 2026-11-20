import type { Author, Notification } from "@/types";

export type Section = "today" | "yesterday" | "week" | "earlier";

export const SECTION_LABELS: Record<Section, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
  earlier: "Plus tôt",
};

/** Section d'une date, en jours calendaires : aujourd'hui, hier, les 7 derniers jours, avant. */
export function sectionOf(date: string, now = new Date()): Section {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(new Date(date))) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return "week";
  return "earlier";
}

/** Une ligne affichée : une notification, ou plusieurs « j'aime » regroupés sur la même publication. */
export type Entry = {
  key: string;
  type: Notification["type"];
  actors: Author[];
  post: Notification["post"];
  comment: Notification["comment"];
  createdAt: string;
  unread: boolean;
  /** Pour un abonnement : l'utilisateur connecté suit-il déjà la personne ? */
  following: boolean;
};

/**
 * Regroupe, dans une même section, les « j'aime » sur une même publication, et range le tout par section.
 * Les notifications arrivent de la plus récente à la plus ancienne ; l'ordre est conservé.
 */
export function groupNotifications(items: Notification[], now = new Date()): { section: Section; entries: Entry[] }[] {
  const sections = new Map<Section, Entry[]>();
  const likes = new Map<string, Entry>();

  for (const n of items) {
    const section = sectionOf(n.createdAt, now);
    const groupKey = n.type === "like" && n.post ? `${section}:${n.post._id}` : null;
    const existing = groupKey ? likes.get(groupKey) : undefined;
    if (existing) {
      if (!existing.actors.some((a) => a._id === n.actor._id)) existing.actors.push(n.actor);
      existing.unread ||= !n.read;
      continue;
    }
    const entry: Entry = {
      key: groupKey ? `like:${groupKey}` : n._id,
      type: n.type,
      actors: [n.actor],
      post: n.post,
      comment: n.comment ?? null,
      createdAt: n.createdAt,
      unread: !n.read,
      following: n.following,
    };
    if (groupKey) likes.set(groupKey, entry);
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section)!.push(entry);
  }

  return (Object.keys(SECTION_LABELS) as Section[])
    .filter((s) => sections.has(s))
    .map((section) => ({ section, entries: sections.get(section)! }));
}
