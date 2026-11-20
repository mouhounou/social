"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CommentInput from "@/components/post/CommentInput";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { shortAgo, timeAgo } from "@/utils/time";
import type { Comment, Post } from "@/types";

type Thread = { open: boolean; items: Comment[] | null; error: string };

type Props = {
  post: Post;
  initial: Comment[];
  /** Nombre total de commentaires, réponses comprises, à chaque changement. */
  onTotalChange: (total: number) => void;
};

/** Commentaires d'une publication, avec leurs réponses (un niveau), sur la page de la publication. */
export default function Comments({ post, initial, onTotalChange }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState(initial);
  const [threads, setThreads] = useState<Record<string, Thread>>({});
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [toDelete, setToDelete] = useState<Comment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reveal = useRef<string | null>(null);

  const total = comments.reduce((n, c) => n + 1 + c.repliesCount, 0);
  useEffect(() => onTotalChange(total), [total, onTotalChange]);

  // Un commentaire qu'on vient d'ajouter est amené à l'écran une fois affiché.
  useEffect(() => {
    if (!reveal.current) return;
    const el = listRef.current?.querySelector(`#comment-${reveal.current}`);
    if (!el) return;
    reveal.current = null;
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  const setThread = (id: string, patch: Partial<Thread>) =>
    setThreads((t) => ({ ...t, [id]: { ...(t[id] ?? { open: false, items: null, error: "" }), ...patch } }));

  async function openThread(id: string) {
    setThread(id, { open: true, error: "" });
    try {
      const { replies } = await api<{ replies: Comment[] }>(`/comments/${id}/replies`);
      setThread(id, { items: replies });
    } catch (err) {
      setThread(id, { error: (err as Error).message });
    }
  }

  function toggleThread(id: string) {
    if (threads[id]?.open) setThread(id, { open: false });
    else openThread(id);
  }

  function startReply(c: Comment) {
    if (!user) return router.push("/login");
    setReplyTo(c);
    inputRef.current?.focus();
  }

  function added(comment: Comment) {
    reveal.current = comment._id;
    if (!comment.parent) {
      setComments((list) => [...list, comment]);
      return;
    }
    const root = comment.parent;
    setReplyTo(null);
    setComments((list) => list.map((c) => (c._id === root ? { ...c, repliesCount: c.repliesCount + 1 } : c)));
    // Fil déjà chargé : la réponse s'y ajoute ; sinon on le charge, elle y sera.
    if (threads[root]?.items) setThread(root, { open: true, items: [...threads[root].items!, comment] });
    else openThread(root);
  }

  async function remove(c: Comment) {
    const { removed } = await api<{ removed: number }>(`/comments/${c._id}`, { method: "DELETE" });
    setToDelete(null);
    if (replyTo && (replyTo._id === c._id || replyTo.parent === c._id)) setReplyTo(null);
    if (c.parent) {
      const root = c.parent;
      setThread(root, { items: threads[root]?.items?.filter((r) => r._id !== c._id) ?? null });
      setComments((list) => list.map((x) => (x._id === root ? { ...x, repliesCount: Math.max(0, x.repliesCount - removed) } : x)));
    } else {
      setComments((list) => list.filter((x) => x._id !== c._id));
    }
  }

  const canDelete = (c: Comment) =>
    !!user && (user._id === c.author._id || user._id === post.author._id || user.role === "admin");

  function item(c: Comment, rootAuthor?: string) {
    const reply = !!c.parent;
    // La mention n'apporte quelque chose que pour une réponse à une réponse.
    const mention = reply && c.replyTo && c.replyTo._id !== rootAuthor ? c.replyTo : null;
    return (
      <div id={`comment-${c._id}`} className="flex scroll-mt-4 gap-3">
        <Link href={`/u/${c.author.username}`} className="shrink-0">
          <Avatar src={c.author.avatar} name={c.author.name} size={reply ? 28 : 36} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-field px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Link href={`/u/${c.author.username}`} className="truncate text-sm font-semibold hover:underline">
                {c.author.name}
              </Link>
              {c.author._id === post.author._id && (
                <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">Auteur</span>
              )}
            </div>
            <p className="mt-0.5 text-sm break-words whitespace-pre-line">
              {mention && (
                <Link href={`/u/${mention.username}`} className="font-medium text-brand hover:underline">
                  @{mention.username}{" "}
                </Link>
              )}
              {c.content}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-4 px-3 text-xs whitespace-nowrap text-muted">
            <time dateTime={c.createdAt} title={timeAgo(c.createdAt)}>
              {shortAgo(c.createdAt)}
            </time>
            <button onClick={() => startReply(c)} className="font-medium hover:text-ink">
              Répondre
            </button>
            {canDelete(c) && (
              <button onClick={() => setToDelete(c)} className="font-medium hover:text-red-500">
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id="comments" className="card flex scroll-mt-24 flex-col lg:sticky lg:top-[97px] lg:max-h-[calc(100dvh-157px)]">
      <h2 className="flex items-center gap-2 border-line p-5 pb-4 font-semibold lg:border-b">
        <MessageCircle className="size-5 text-brand" /> Commentaires ({total})
      </h2>

      {/* Sur desktop le champ de saisie passe sous la liste, qui défile seule. */}
      <div className="border-line px-5 lg:order-last lg:border-t lg:py-4">
        <CommentInput
          postId={post._id}
          onAdded={added}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          inputRef={inputRef}
        />
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

        <ul className="space-y-5">
          {comments.map((c) => {
            const thread = threads[c._id];
            return (
              <li key={c._id}>
                {item(c)}
                {c.repliesCount > 0 && (
                  <button
                    onClick={() => toggleThread(c._id)}
                    aria-expanded={!!thread?.open}
                    className="mt-2 ml-12 flex items-center gap-2 text-xs font-medium text-muted hover:text-ink"
                  >
                    <span className="h-px w-6 bg-line" />
                    {thread?.open
                      ? "Masquer les réponses"
                      : c.repliesCount === 1
                        ? "Voir la réponse"
                        : `Voir les ${c.repliesCount} réponses`}
                  </button>
                )}
                {thread?.open && (
                  <div className="mt-3 ml-12">
                    {thread.error ? (
                      <p className="text-xs text-red-500">
                        {thread.error}{" "}
                        <button onClick={() => openThread(c._id)} className="font-medium underline">
                          Réessayer
                        </button>
                      </p>
                    ) : !thread.items ? (
                      <p className="text-xs text-muted">Chargement des réponses…</p>
                    ) : (
                      <ul className="space-y-3">
                        {thread.items.map((r) => (
                          <li key={r._id}>
                            {item(r, c.author._id)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {toDelete && (
        <ConfirmDialog
          tone="danger"
          title={toDelete.parent ? "Supprimer cette réponse ?" : "Supprimer ce commentaire ?"}
          description={
            !toDelete.parent && toDelete.repliesCount > 0
              ? `Ses ${toDelete.repliesCount > 1 ? `${toDelete.repliesCount} réponses seront aussi supprimées` : "réponse sera aussi supprimée"}.`
              : "Cette action est définitive."
          }
          confirmLabel="Supprimer"
          onConfirm={() => remove(toDelete)}
          onCancel={() => setToDelete(null)}
        />
      )}
    </section>
  );
}
