"use client";

import { useEffect, useState } from "react";
import PostForm from "@/components/post/PostForm";
import RequireAuth from "@/components/auth/RequireAuth";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Post } from "@/types";

export default function EditPost({ id }: { id: string }) {
  return (
    <RequireAuth>
      <EditPostForm id={id} />
    </RequireAuth>
  );
}

function EditPostForm({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    api<{ post: Post }>(`/posts/${id}`)
      .then((d) => setPost(d.post))
      .catch((err) => setError(err.message));
  }, [id, loading]);

  if (error) return <p className="card mx-auto max-w-2xl p-10 text-center text-sm text-muted">{error}</p>;
  if (!post || !user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (post.author._id !== user._id && user.role !== "admin") {
    return (
      <p className="card mx-auto max-w-2xl p-10 text-center text-sm text-muted">
        Tu ne peux modifier que tes propres publications.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PostForm post={post} />
    </div>
  );
}
