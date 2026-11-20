"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Post } from "@/types";

/**
 * Like et enregistrement d'une publication, affichés tout de suite puis confirmés par l'API.
 * `toggle` renvoie le nouvel état, ou null si l'action n'a pas abouti.
 */
export function usePostReactions(initial: Post) {
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState(initial);
  // Nouvelle publication reçue du parent (rechargement de la liste) : on repart d'elle.
  const [source, setSource] = useState(initial);
  if (initial !== source) {
    setSource(initial);
    setPost(initial);
  }

  async function toggle(kind: "like" | "save"): Promise<boolean | null> {
    if (!user) {
      router.push("/login");
      return null;
    }

    const key = kind === "like" ? "liked" : "saved";
    const countKey = kind === "like" ? "likesCount" : "savesCount";
    const was = post[key];
    setPost((p) => ({ ...p, [key]: !was, [countKey]: p[countKey] + (was ? -1 : 1) }));

    try {
      const res = await api<{ active: boolean; count: number }>(`/posts/${post._id}/${kind}`, { method: "POST" });
      setPost((p) => ({ ...p, [key]: res.active, [countKey]: res.count }));
      return res.active;
    } catch {
      setPost((p) => ({ ...p, [key]: was, [countKey]: p[countKey] + (was ? 1 : -1) }));
      return null;
    }
  }

  return { post, setPost, toggle };
}
