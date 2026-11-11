"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

type Props = {
  userId: string;
  initial: boolean;
  variant?: "link" | "button";
  onChange?: (following: boolean) => void;
};

export default function FollowButton({ userId, initial, variant = "link", onChange }: Props) {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function click() {
    if (!user) return router.push("/login");
    setBusy(true);
    try {
      const res = await api<{ following: boolean }>(`/users/${userId}/follow`, { method: "POST" });
      setFollowing(res.following);
      onChange?.(res.following);
      refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (variant === "button") {
    return (
      <button onClick={click} disabled={busy} className={following ? "btn-ghost" : "btn-primary"}>
        {following ? "Abonné" : "Suivre"}
      </button>
    );
  }

  return (
    <button
      onClick={click}
      disabled={busy}
      className={`text-xs font-medium ${following ? "text-muted" : "text-brand"} disabled:opacity-50`}
    >
      {following ? "Abonné" : "Suivre"}
    </button>
  );
}
