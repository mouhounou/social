"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import Avatar from "./Avatar";

export default function ProfileCard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<User | null>(null);

  useEffect(() => {
    if (!user) return;
    api<{ user: User }>("/users/me").then((d) => setStats(d.user)).catch(() => {});
  }, [user]);

  if (loading) return <div className="card h-80 animate-pulse" />;
  if (!user) return <GuestCard />;

  const counts = [
    { label: "Posts", value: stats?.postsCount ?? 0 },
    { label: "Abonnés", value: user.followersCount },
    { label: "Abonnements", value: user.followingCount },
  ];

  return (
    <div className="card p-4">
      <div className="relative h-[70px] overflow-hidden rounded-2xl bg-gradient-to-r from-amber-100 via-orange-50 to-sky-100">
        {user.cover && <Image src={user.cover} alt="" fill className="object-cover" sizes="260px" />}
      </div>
      <div className="relative -mt-9 flex flex-col items-center text-center">
        <Avatar src={user.avatar} name={user.name} size={80} className="ring-4 ring-white" />
        <p className="mt-3 font-semibold">{user.name}</p>
        <p className="text-sm text-muted">@{user.username}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 rounded-2xl border border-line py-3 text-center">
        {counts.map((c) => (
          <div key={c.label}>
            <p className="font-semibold">{c.value}</p>
            <p className="text-[11px] text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <Link href={`/u/${user.username}`} className="btn-primary mt-6 w-full">
        Mon profil
      </Link>
    </div>
  );
}

function GuestCard() {
  return (
    <div className="card overflow-hidden p-4">
      <div className="rounded-2xl bg-gradient-to-br from-brand to-sky-400 p-5 text-white">
        <p className="text-lg font-semibold">Bienvenue sur Solola</p>
        <p className="mt-1 text-sm text-white/85">
          Rejoins la communauté pour publier, commenter et suivre tes créateurs préférés.
        </p>
      </div>
      <Link href="/register" className="btn-primary mt-5 w-full">
        Créer un compte
      </Link>
      <Link href="/login" className="btn-ghost mt-2 w-full">
        J&apos;ai déjà un compte
      </Link>
    </div>
  );
}
