"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, EllipsisVertical, Heart, MessageCircle, Pencil, Send, Trash2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { api } from "@/lib/api";
import { compact, timeAgo } from "@/utils/time";
import type { Post } from "@/types";
import Avatar from "@/components/ui/Avatar";
import CommentInput from "@/components/post/CommentInput";
import RichText from "@/components/ui/RichText";
import { extraTags } from "@/lib/tags";

type Props = {
  post: Post;
  full?: boolean;
  onDeleted?: (id: string) => void;
  onComment?: () => void;
  commentsCount?: number;
};

export default function PostCard({ post: initial, full = false, onDeleted, onComment, commentsCount }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [source, setSource] = useState(initial);
  if (initial !== source) {
    setSource(initial);
    setPost(initial);
  }
  const [menu, setMenu] = useState(false);
  const menuRef = useOutsideClick<HTMLDivElement>(menu, () => setMenu(false));
  const [copied, setCopied] = useState(false);

  const isOwner = user && (user._id === post.author._id || user.role === "admin");
  const long = !full && post.content.length > 280;
  const tags = extraTags(post.tags ?? [], post.content);
  const content = long ? post.content.slice(0, 280).trimEnd() + "…" : post.content;

  async function toggle(kind: "like" | "save") {
    if (!user) return router.push("/login");

    const key = kind === "like" ? "liked" : "saved";
    const countKey = kind === "like" ? "likesCount" : "savesCount";
    const was = post[key];
    setPost((p) => ({ ...p, [key]: !was, [countKey]: p[countKey] + (was ? -1 : 1) }));

    try {
      const res = await api<{ active: boolean; count: number }>(`/posts/${post._id}/${kind}`, { method: "POST" });
      setPost((p) => ({ ...p, [key]: res.active, [countKey]: res.count }));
    } catch {
      setPost((p) => ({ ...p, [key]: was, [countKey]: p[countKey] + (was ? 1 : -1) }));
    }
  }

  async function remove() {
    if (!confirm("Supprimer cette publication ?")) return;
    try {
      await api(`/posts/${post._id}`, { method: "DELETE" });
      onDeleted?.(post._id);
      if (full) router.push("/");
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function share() {
    const url = `${window.location.origin}/posts/${post._id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copie ce lien :", url);
    }
  }

  return (
    <article className="card p-4">
      <header className="flex items-center gap-3">
        <Link href={`/u/${post.author.username}`}>
          <Avatar src={post.author.avatar} name={post.author.name} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${post.author.username}`} className="text-sm font-semibold hover:underline">
            {post.author.name}
          </Link>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            {timeAgo(post.createdAt)} · {post.category}
            {post.visibility === "followers" && <Users className="size-3" />}
          </p>
        </div>

        {isOwner && (
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenu((m) => !m)} className="rounded-full p-1.5 hover:bg-field">
              <EllipsisVertical className="size-5" />
            </button>
            {menu && (
              <div
                className="card absolute right-0 z-10 mt-1 w-40 p-1.5 shadow-lg ring-1 ring-line"
              >
                <Link
                  href={`/posts/${post._id}/edit`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-field"
                >
                  <Pencil className="size-4" /> Modifier
                </Link>
                <button
                  onClick={remove}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="size-4" /> Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="mt-4 text-sm leading-relaxed">
        {full ? (
          <h1 className="mb-2 text-xl font-semibold">{post.title}</h1>
        ) : (
          <Link href={`/posts/${post._id}`} className="mb-1 block font-semibold hover:text-brand">
            {post.title}
          </Link>
        )}
        <p className="whitespace-pre-line">
          <RichText text={content} />
          {long && (
            <Link href={`/posts/${post._id}`} className="ml-1 font-medium text-brand">
              Lire la suite
            </Link>
          )}
        </p>
        {tags.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
            {tags.map((tag) => (
              <Link key={tag} prefetch={false} href={`/?tag=${encodeURIComponent(tag)}`} className="text-brand hover:underline">
                #{tag}
              </Link>
            ))}
          </p>
        )}
      </div>

      {post.image && (
        <Link href={`/posts/${post._id}`} className="mt-4 block overflow-hidden rounded-2xl bg-field">
          <Image
            src={post.image}
            alt={post.title}
            width={1200}
            height={800}
            sizes="(min-width: 1024px) 640px, 100vw"
            className={`w-full object-cover ${full ? "max-h-[640px]" : "max-h-[420px]"}`}
          />
        </Link>
      )}

      <footer className="mt-4 flex items-center gap-6 text-sm">
        <button onClick={() => toggle("like")} className="flex items-center gap-1.5">
          <Heart className={`size-5 ${post.liked ? "fill-red-500 text-red-500" : ""}`} />
          {compact(post.likesCount)}
        </button>
        <Link href={`/posts/${post._id}#comments`} className="flex items-center gap-1.5">
          <MessageCircle className="size-5" />
          {compact(commentsCount ?? post.commentsCount)}
        </Link>
        <button onClick={() => toggle("save")} className="flex items-center gap-1.5">
          <Bookmark className={`size-5 ${post.saved ? "fill-brand text-brand" : ""}`} />
          {compact(post.savesCount)}
        </button>
        <button onClick={share} className="ml-auto flex items-center gap-1.5 text-muted hover:text-ink">
          {copied && <span className="text-xs">Lien copié</span>}
          <Send className="size-5" />
        </button>
      </footer>

      {!full && (
        <div className="mt-4">
          <CommentInput
            postId={post._id}
            onAdded={() => {
              setPost((p) => ({ ...p, commentsCount: p.commentsCount + 1 }));
              onComment?.();
            }}
          />
        </div>
      )}
    </article>
  );
}
