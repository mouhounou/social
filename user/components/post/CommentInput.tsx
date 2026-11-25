"use client";

import Link from "next/link";
import { useState } from "react";
import { CornerDownRight, SendHorizontal, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Comment } from "@/types";
import Avatar from "@/components/ui/Avatar";

type Props = {
  postId: string;
  onAdded: (comment: Comment) => void;
  /** Commentaire ou réponse auquel on répond ; absent pour un nouveau commentaire. */
  replyTo?: Comment | null;
  onCancelReply?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
};

export default function CommentInput({ postId, onAdded, replyTo, onCancelReply, inputRef }: Props) {
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
        body: { content: text, ...(replyTo && { parent: replyTo._id }) },
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
      {replyTo && (
        <div className="ml-12 flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-1.5 text-xs text-brand">
          <CornerDownRight className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            En réponse à <b>{replyTo.author.name}</b>
          </span>
          <button type="button" onClick={onCancelReply} aria-label="Annuler la réponse" className="shrink-0 rounded-full p-0.5 hover:bg-brand/15">
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Avatar src={user.avatar} name={user.name} size={36} />
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && replyTo && onCancelReply?.()}
            placeholder={replyTo ? `Réponds à ${replyTo.author.name}` : "Écris ton commentaire"}
            aria-label={replyTo ? `Répondre à ${replyTo.author.name}` : "Écrire un commentaire"}
            className="input py-2.5 pr-11"
            maxLength={1000}
          />
          {content.trim() && (
            <button disabled={sending} aria-label="Envoyer" className="absolute top-1/2 right-3 -translate-y-1/2 text-brand">
              <SendHorizontal className="size-5" />
            </button>
          )}
        </div>
      </div>
      {error && <p className="pl-12 text-xs text-red-500">{error}</p>}
    </form>
  );
}
