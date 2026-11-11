"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import Avatar from "@/components/Avatar";
import CommentInput from "@/components/CommentInput";
import PostCard from "@/components/PostCard";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time";
import type { Comment, Post } from "@/lib/types";

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
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Retour
      </Link>

      <PostCard post={post} full commentsCount={comments.length} />

      <section id="comments" className="card space-y-5 p-5">
        <h2 className="font-semibold">Commentaires ({comments.length})</h2>

        <CommentInput postId={post._id} onAdded={(c) => setComments((list) => [...list, c])} />

        {comments.length === 0 && <p className="text-sm text-muted">Sois le premier à commenter.</p>}

        <ul className="space-y-4">
          {comments.map((c) => {
            const canDelete =
              user && (user._id === c.author._id || user._id === post.author._id || user.role === "admin");
            return (
              <li key={c._id} className="group flex gap-3">
                <Link href={`/u/${c.author.username}`}>
                  <Avatar src={c.author.avatar} name={c.author.name} size={36} />
                </Link>
                <div className="flex-1 rounded-2xl bg-field px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/u/${c.author.username}`} className="text-sm font-semibold">
                      {c.author.name}
                    </Link>
                    <span className="text-[11px] text-muted">{timeAgo(c.createdAt)}</span>
                    {canDelete && (
                      <button
                        onClick={() => removeComment(c._id)}
                        className="ml-auto text-muted opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-line">{c.content}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
