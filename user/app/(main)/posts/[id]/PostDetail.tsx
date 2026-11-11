"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Trash2 } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import CommentInput from "@/components/post/CommentInput";
import PostCard from "@/components/post/PostCard";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { timeAgo } from "@/utils/time";
import type { Comment, Post } from "@/types";

export default function PostDetail({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    Promise.all([
      api<{ post: Post }>(`/posts/${id}`),
      api<{ comments: Comment[] }>(`/posts/${id}/comments`),
    ])
      .then(([p, c]) => {
        setPost(p.post);
        setComments(c.comments);
      })
      .catch((err) => setError(err.message));
  }, [id, authLoading]);

  const listRef = useRef<HTMLDivElement>(null);
  const justAdded = useRef(false);

  function addComment(comment: Comment) {
    justAdded.current = true;
    setComments((list) => [...list, comment]);
  }

  // Le nouveau commentaire est en bas de la liste : on l'amène à l'écran une fois affiché.
  useEffect(() => {
    if (!justAdded.current) return;
    justAdded.current = false;
    listRef.current?.querySelector("li:last-child")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [comments.length]);

  async function removeComment(commentId: string) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      await api(`/comments/${commentId}`, { method: "DELETE" });
      setComments((list) => list.filter((c) => c._id !== commentId));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  if (error) {
    return (
      <div className="card mx-auto max-w-2xl p-10 text-center">
        <p className="text-sm text-muted">{error}</p>
        <Link href="/" className="btn-primary mt-6">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl lg:max-w-6xl">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Retour
      </Link>

      {/* Desktop : la publication à gauche, les commentaires à droite dans un panneau qui reste à l'écran. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        <PostCard post={post} full commentsCount={comments.length} />

        <section
          id="comments"
          className="card flex scroll-mt-24 flex-col lg:sticky lg:top-[97px] lg:max-h-[calc(100dvh-157px)]"
        >
          <h2 className="flex items-center gap-2 border-line p-5 pb-4 font-semibold lg:border-b">
            <MessageCircle className="size-5 text-brand" /> Commentaires ({comments.length})
          </h2>

          {/* Sur desktop le champ de saisie passe sous la liste, qui défile seule. */}
          <div className="border-line px-5 lg:order-last lg:border-t lg:py-4">
            <CommentInput postId={post._id} onAdded={addComment} />
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 p-5 lg:overflow-y-auto lg:[scrollbar-color:var(--color-line)_transparent] lg:[scrollbar-width:thin]"
          >
            {comments.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted">
                <span className="flex size-12 items-center justify-center rounded-full bg-field">
                  <MessageCircle className="size-5" />
                </span>
                Sois le premier à commenter.
              </div>
            )}

            <ul className="space-y-4">
              {comments.map((c) => {
                const canDelete =
                  user && (user._id === c.author._id || user._id === post.author._id || user.role === "admin");
                return (
                  <li key={c._id} className="group flex gap-3">
                    <Link href={`/u/${c.author.username}`} className="shrink-0">
                      <Avatar src={c.author.avatar} name={c.author.name} size={36} />
                    </Link>
                    <div className="min-w-0 flex-1 rounded-2xl bg-field px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/u/${c.author.username}`} className="truncate text-sm font-semibold hover:underline">
                          {c.author.name}
                        </Link>
                        <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.createdAt)}</span>
                        {canDelete && (
                          <button
                            onClick={() => removeComment(c._id)}
                            aria-label="Supprimer le commentaire"
                            className="ml-auto shrink-0 text-muted transition hover:text-red-500 focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm break-words whitespace-pre-line">{c.content}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
