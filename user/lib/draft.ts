import type { Post } from "@/types";

/** Brouillon passé du formulaire rapide du fil au formulaire complet (/posts/new), image comprise. */
export type PostDraft = {
  title: string;
  content: string;
  category: string;
  tags: string[];
  visibility: Post["visibility"];
  file: File | null;
  preview: string | null;
};

// Gardé en mémoire : la navigation vers /posts/new se fait sans recharger la page.
let pending: PostDraft | null = null;

export function saveDraft(draft: PostDraft) {
  pending = draft;
}

export function peekDraft() {
  return pending;
}

export function clearDraft() {
  pending = null;
}
