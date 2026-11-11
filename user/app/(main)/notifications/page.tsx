"use client";

import { useEffect, useState } from "react";
import { NotificationItem } from "@/components/ActivityCard";
import RequireAuth from "@/components/RequireAuth";
import Spinner from "@/components/Spinner";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationList />
    </RequireAuth>
  );
}

function NotificationList() {
  const [items, setItems] = useState<Notification[] | null>(null);

  useEffect(() => {
    api<{ notifications: Notification[] }>("/notifications?limit=50")
      .then((d) => {
        setItems(d.notifications);
        return api("/notifications/read", { method: "PATCH" });
      })
      .then(() => window.dispatchEvent(new Event("solola:notifications-read")))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="card mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-lg font-semibold">Activité</h1>
      {items === null ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">Aucune notification.</p>
      ) : (
        <ul className="space-y-5">
          {items.map((n) => (
            <NotificationItem key={n._id} n={n} className={n.read ? "" : "rounded-xl bg-brand-soft/60 p-2"} />
          ))}
        </ul>
      )}
    </div>
  );
}
