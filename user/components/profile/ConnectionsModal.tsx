"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/profile/FollowButton";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Connection } from "@/types";

type ListType = "followers" | "following";

type Props = {
  username: string;
  /** Nom affiché du profil, en titre de la fenêtre. */
  name: string;
  type: ListType;
  counts: Record<ListType, number>;
  onClose: () => void;
  /** Appelé quand l'utilisateur connecté suit ou ne suit plus un compte de la liste. */
  onFollowChange?: (following: boolean) => void;
};

const TABS: { key: ListType; label: string }[] = [
  { key: "followers", label: "Abonnés" },
  { key: "following", label: "Abonnements" },
];

const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export default function ConnectionsModal({ username, name, type: initialType, counts, onClose, onFollowChange }: Props) {
  const { user: me } = useAuth();
  const own = me?.username === username;
  const [type, setType] = useState(initialType);
  const [result, setResult] = useState<{ type: ListType; users: Connection[] } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<{ users: Connection[] }>(`/users/${username}/${type}`)
      .then((d) => {
        if (cancelled) return;
        setResult({ type, users: d.users });
        setError("");
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [username, type, attempt]);

  const users = result?.type === type ? result.users : null;
  const query = fold(search.trim());
  const shown = users && query ? users.filter((u) => fold(`${u.name} ${u.username}`).includes(query)) : users;

  const subtitle =
    type === "followers"
      ? own ? "Les personnes qui te suivent." : `Les personnes qui suivent ${name}.`
      : own ? "Les personnes que tu suis." : `Les personnes que ${name} suit.`;
  const empty =
    type === "followers"
      ? own ? "Personne ne te suit pour l'instant." : `Personne ne suit ${name} pour l'instant.`
      : own ? "Tu ne suis personne pour l'instant." : `${name} ne suit personne pour l'instant.`;
  // Sur ses propres abonnés, tout le monde nous suit : le badge « Te suit » n'y apprend rien.
  const showFollowsYou = !(own && type === "followers");

  function openTab(next: ListType) {
    if (next === type) return;
    setType(next);
    setSearch("");
    setError("");
  }

  return (
    <Modal title={name} onClose={onClose} width="max-w-md">
      <div className="flex h-[min(560px,75vh)] flex-col">
        <div role="tablist" aria-label="Listes" className="grid shrink-0 grid-cols-2 border-b border-line">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={type === tab.key}
              onClick={() => openTab(tab.key)}
              className={`relative py-3 text-sm font-medium transition ${type === tab.key ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              {tab.label} <span className="ml-0.5 text-xs text-muted">{counts[tab.key]}</span>
              {type === tab.key && <span className="absolute inset-x-8 bottom-0 h-0.5 rounded-full bg-brand" />}
            </button>
          ))}
        </div>

        <div className="shrink-0 px-5 pt-4">
          <p className="text-xs text-muted">{subtitle}</p>
          {users && users.length > 0 && (
            <div className="relative mt-3">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher"
                aria-label="Rechercher dans la liste"
                className="input py-2.5 pl-10"
              />
            </div>
          )}
        </div>

        <div role="tabpanel" aria-label={TABS.find((t) => t.key === type)!.label} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-sm">
              <p className="text-red-500">{error}</p>
              <button onClick={() => setAttempt((n) => n + 1)} className="btn-ghost py-2">
                Réessayer
              </button>
            </div>
          ) : !shown ? (
            <ul aria-busy className="space-y-1">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 px-2 py-2">
                  <span className="size-11 shrink-0 animate-pulse rounded-full bg-field" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3 w-1/2 animate-pulse rounded bg-field" />
                    <span className="block h-2.5 w-3/4 animate-pulse rounded bg-field" />
                  </span>
                </li>
              ))}
            </ul>
          ) : users!.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted">
              <span className="flex size-12 items-center justify-center rounded-full bg-field">
                <Users className="size-5" />
              </span>
              {empty}
            </div>
          ) : shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Aucun compte ne correspond à « {search.trim()} ».</p>
          ) : (
            <ul className="space-y-1">
              {shown.map((u) => (
                <li key={u._id} className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-field/60">
                  <Link href={`/u/${u.username}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size={44} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{u.name}</span>
                        {showFollowsYou && u.followsYou && !u.isMe && (
                          <span className="shrink-0 rounded-full bg-field px-2 py-0.5 text-[10px] font-medium text-muted">
                            Te suit
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        @{u.username}
                        {u.bio && ` · ${u.bio}`}
                      </span>
                    </span>
                  </Link>
                  {u.isMe ? (
                    <span className="shrink-0 rounded-full bg-field px-3 py-1 text-xs font-medium text-muted">Toi</span>
                  ) : (
                    <FollowButton
                      userId={u._id}
                      initial={u.isFollowing}
                      variant="pill"
                      confirm={{ name: u.name, avatar: u.avatar }}
                      followLabel={type === "followers" && own && !u.isFollowing ? "Suivre en retour" : "Suivre"}
                      onChange={onFollowChange}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
