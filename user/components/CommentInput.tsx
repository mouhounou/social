"use client";

import Link from "next/link";
import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";
import Avatar from "./Avatar";

type Props = {
  postId: string;
  onAdded: (comment: Comment) => void;
};

export default function CommentInput({ postId, onAdded }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Avatar name="Invité" size={36} />
        <Link href="/login" className="input block truncate py-2.5 text-muted">
          Connecte-toi pour commenter
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    setSending(true);
    setError("");
    try {
      const { comment } = await api<{ comment: Comment }>(`/posts/${postId}/comments`, {
        method: "POST",
        body: { content: text },
      });
      onAdded(comment);
      setContent("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-1.5">
      <div className="flex items-center gap-3">
      <Avatar src={user.avatar} name={user.name} size={36} />
      <div className="relative flex-1">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écris ton commentaire"
          className="input py-2.5 pr-11"
          maxLength={1000}
        />
        {content.trim() && (
          <button disabled={sending} className="absolute top-1/2 right-3 -translate-y-1/2 text-brand">
            <SendHorizontal className="size-5" />
          </button>
        )}
      </div>
      </div>
      {error && <p className="pl-12 text-xs text-red-500">{error}</p>}
    </form>
  );
}
