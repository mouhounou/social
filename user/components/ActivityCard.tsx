"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { shortAgo } from "@/lib/time";
import type { Notification } from "@/lib/types";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

const verbs = {
  like: "a aimé ta publication.",
  comment: "a commenté ta publication.",
  follow: "a commencé à te suivre.",
};

function isToday(date: string) {
  return new Date(date).toDateString() === new Date().toDateString();
}

export function NotificationItem({ n, className = "" }: { n: Notification; className?: string }) {
  return (
    <li className={`flex items-center gap-3 ${className}`}>
      <Link href={`/u/${n.actor.username}`}>
        <Avatar src={n.actor.avatar} name={n.actor.name} size={40} />
      </Link>
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted">
        <Link href={`/u/${n.actor.username}`} className="font-semibold text-ink">
          {n.actor.username}
        </Link>{" "}
        {verbs[n.type]} <span className="whitespace-nowrap">{shortAgo(n.createdAt)}</span>
      </p>
      {n.type === "follow" ? (
        <FollowButton userId={n.actor._id} initial={n.following} />
      ) : (
        n.post && (
          <Link href={`/posts/${n.post._id}`} className="shrink-0">
            {n.post.image ? (
              <Image src={n.post.image} alt="" width={40} height={40} className="size-10 rounded-xl object-cover" />
            ) : (
              <span
                title={n.post.title}
                className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand"
              >
                {n.type === "like" ? <Heart className="size-4" /> : <MessageCircle className="size-4" />}
              </span>
            )}
          </Link>
        )
      )}
    </li>
  );
}

export default function ActivityCard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api<{ notifications: Notification[] }>("/notifications?limit=6")
      .then((d) => setItems(d.notifications))
      .catch(() => setItems([]));
  }, [user]);

  if (!user) return null;

  const today = items?.filter((n) => isToday(n.createdAt)) ?? [];
  const older = items?.filter((n) => !isToday(n.createdAt)) ?? [];

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">Activité</p>
        <Link href="/notifications" className="text-xs text-muted hover:text-brand">
          Tout voir
        </Link>
      </div>

      {items === null ? (
        <div className="h-24 animate-pulse rounded-xl bg-field" />
      ) : items.length === 0 ? (
        <p className="text-xs text-muted">Rien de nouveau pour l&apos;instant.</p>
      ) : (
        <>
          {today.length > 0 && <ul className="space-y-4">{today.map((n) => <NotificationItem key={n._id} n={n} />)}</ul>}
          {older.length > 0 && (
            <>
              <p className="mt-5 mb-3 text-sm font-semibold">Plus tôt</p>
              <ul className="space-y-4">{older.map((n) => <NotificationItem key={n._id} n={n} />)}</ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
