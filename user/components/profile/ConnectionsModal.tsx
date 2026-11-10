"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { api } from "@/lib/api";
import type { Connection } from "@/lib/types";

type Props = {
  username: string;
  type: "followers" | "following";
  onClose: () => void;
};

export default function ConnectionsModal({ username, type, onClose }: Props) {
  const [users, setUsers] = useState<Connection[] | null>(null);

  useEffect(() => {
    api<{ users: Connection[] }>(`/users/${username}/${type}`)
      .then((d) => setUsers(d.users))
      .catch(() => setUsers([]));
  }, [username, type]);

  return (
    <Modal title={type === "followers" ? "Abonnés" : "Abonnements"} onClose={onClose} width="max-w-md">
      <div className="p-5">
        {users === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {type === "followers" ? "Personne ne suit ce compte pour l'instant." : "Ce compte ne suit personne."}
          </p>
        ) : (
          <ul className="space-y-4">
            {users.map((u) => (
              <li key={u._id} className="flex items-center gap-3">
                <Link href={`/u/${u.username}`} onClick={onClose}>
                  <Avatar src={u.avatar} name={u.name} size={44} />
                </Link>
                <Link href={`/u/${u.username}`} onClick={onClose} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="truncate text-xs text-muted">{u.bio || `@${u.username}`}</p>
                </Link>
                {!u.isMe && <FollowButton userId={u._id} initial={u.isFollowing} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
