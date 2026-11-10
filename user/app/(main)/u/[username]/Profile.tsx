"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import Avatar from "@/components/Avatar";
import Feed from "@/components/Feed";
import FollowButton from "@/components/FollowButton";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

const roles = { reader: "Lecteur", author: "Auteur", admin: "Admin" };

export default function Profile({ username }: { username: string }) {
  const { user: me, loading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    api<{ user: User }>(`/users/${username}`)
      .then((d) => setUser(d.user))
      .catch((err) => setError(err.message));
  }, [username, loading, me?._id]);

  if (error) return <p className="card mx-auto max-w-3xl p-10 text-center text-sm text-muted">{error}</p>;
  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card overflow-hidden">
        <div className="relative h-44 bg-gradient-to-r from-amber-100 via-orange-50 to-sky-100">
          {user.cover && <Image src={user.cover} alt="" fill priority className="object-cover" sizes="768px" />}
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <Avatar src={user.avatar} name={user.name} size={104} className="ring-4 ring-white" />
            {user.isMe ? (
              <Link href="/settings" className="btn-ghost">
                <Settings className="size-4" /> Modifier le profil
              </Link>
            ) : (
              <FollowButton
                variant="button"
                userId={user._id}
                initial={!!user.isFollowing}
                onChange={(f) =>
                  setUser((u) => u && { ...u, isFollowing: f, followersCount: u.followersCount + (f ? 1 : -1) })
                }
              />
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{user.name}</h1>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand">
                {roles[user.role]}
              </span>
            </div>
            <p className="text-sm text-muted">@{user.username}</p>
            {user.bio && <p className="mt-3 text-sm">{user.bio}</p>}
          </div>

          <div className="mt-5 flex gap-8 text-sm">
            <p>
              <span className="font-semibold">{user.postsCount ?? 0}</span> <span className="text-muted">posts</span>
            </p>
            <p>
              <span className="font-semibold">{user.followersCount}</span> <span className="text-muted">abonnés</span>
            </p>
            <p>
              <span className="font-semibold">{user.followingCount}</span> <span className="text-muted">abonnements</span>
            </p>
          </div>
        </div>
      </div>

      <Feed
        filters={{ author: user.username }}
        showComposer={user.isMe}
        empty={user.isMe ? "Tu n'as encore rien publié." : "Aucune publication."}
      />
    </div>
  );
}
