"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Suggestion } from "@/lib/types";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

export default function SuggestionsCard() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<Suggestion[] | null>(null);

  useEffect(() => {
    if (loading) return;
    api<{ users: Suggestion[] }>("/users/suggestions")
      .then((d) => setUsers(d.users))
      .catch(() => setUsers([]));
  }, [loading, user?._id]);

  if (users && users.length === 0) return null;

  return (
    <div className="card p-4">
      <p className="mb-4 font-semibold">Suggestions pour toi</p>
      {users === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-field" />
      ) : (
        <ul className="space-y-4">
          {users.map((u) => (
            <li key={u._id} className="flex items-center gap-3">
              <Link href={`/u/${u.username}`}>
                <Avatar src={u.avatar} name={u.name} size={40} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/u/${u.username}`} className="block truncate text-sm font-semibold">
                  {u.name}
                </Link>
                <p className="truncate text-[11px] text-muted">{u.hint}</p>
              </div>
              <FollowButton userId={u._id} initial={false} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
