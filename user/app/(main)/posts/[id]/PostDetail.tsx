"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Comments from "@/components/post/Comments";
import PostCard from "@/components/post/PostCard";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Comment, Post } from "@/types";

export default function PostDetail({ id }: { id: string }) {
  const { loading: authLoading } = useAuth();
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

  const [total, setTotal] = useState(0);

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
        <PostCard post={post} full commentsCount={total} />

        <Comments post={post} initial={comments} onTotalChange={setTotal} />
      </div>
    </div>
  );
}
