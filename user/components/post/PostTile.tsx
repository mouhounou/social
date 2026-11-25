"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, FileText, Heart, ListOrdered, MessageCircle, Users } from "lucide-react";
import { usePostReactions } from "@/hooks/usePostReactions";
import { compact, timeAgo } from "@/utils/time";
import type { Post } from "@/types";
import Avatar from "@/components/ui/Avatar";

type Props = {
  post: Post;
  /** Masqué sur un profil, où toutes les publications sont du même auteur. */
  showAuthor?: boolean;
  onSavedChange?: (saved: boolean) => void;
};

/** Carte compacte d'une publication, pour les grilles (profil, enregistrés). */
export default function PostTile({ post: initial, showAuthor = true, onSavedChange }: Props) {
  const { post, toggle } = usePostReactions(initial);
  const paragraphs = post.paragraphs ?? [];
  const image =
    post.image ?? paragraphs.find((p) => p.media?.type === "image" && p.media.provider === "cloudinary")?.media?.url;
  const href = `/posts/${post._id}`;

  async function save() {
    const saved = await toggle("save");
    if (saved !== null) onSavedChange?.(saved);
  }

  return (
    <article className="card group flex min-w-0 flex-col overflow-hidden">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-[4/3] overflow-hidden bg-field">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-soft to-indigo-100 text-brand">
            <FileText className="size-8" />
            <span className="text-xs font-medium">{post.category}</span>
          </div>
        )}
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
          {post.visibility === "followers" && (
            <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-white backdrop-blur">
              <Users className="size-3" /> Abonnés
            </span>
          )}
          {paragraphs.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-white backdrop-blur">
              <ListOrdered className="size-3" /> {paragraphs.length} paragraphe{paragraphs.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] text-muted">
          {post.category} · {timeAgo(post.createdAt)}
        </p>
        <h2 className="mt-1 line-clamp-2 leading-snug font-semibold">
          <Link href={href} className="hover:text-brand">
            {post.title}
          </Link>
        </h2>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted">{post.content}</p>

        <div className="mt-auto flex items-center gap-3 pt-4 text-xs">
          {showAuthor && (
            <Link href={`/u/${post.author.username}`} className="mr-auto flex min-w-0 items-center gap-2 hover:underline">
              <Avatar src={post.author.avatar} name={post.author.name} size={24} />
              <span className="truncate font-medium">{post.author.name}</span>
            </Link>
          )}
          <button
            onClick={() => toggle("like")}
            aria-label={post.liked ? "Ne plus aimer" : "Aimer"}
            aria-pressed={post.liked}
            className="flex shrink-0 items-center gap-1"
          >
            <Heart className={`size-4 ${post.liked ? "fill-red-500 text-red-500" : ""}`} />
            {compact(post.likesCount)}
          </button>
          <Link href={`${href}#comments`} aria-label="Commentaires" className="flex shrink-0 items-center gap-1">
            <MessageCircle className="size-4" />
            {compact(post.commentsCount)}
          </Link>
          <button
            onClick={save}
            aria-label={post.saved ? "Retirer des enregistrements" : "Enregistrer"}
            aria-pressed={post.saved}
            className={`shrink-0 ${showAuthor ? "" : "ml-auto"}`}
          >
            <Bookmark className={`size-4 ${post.saved ? "fill-brand text-brand" : ""}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
