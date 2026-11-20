"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Props = {
  userId: string;
  initial: boolean;
  variant?: "link" | "button" | "pill";
  onChange?: (following: boolean) => void;
  /** Demande une confirmation avant de suivre ou de se désabonner. */
  confirm?: { name: string; avatar?: string | null };
  /** Libellé quand on ne suit pas encore le compte (« Suivre » par défaut). */
  followLabel?: string;
};

export default function FollowButton({ userId, initial, variant = "link", onChange, confirm, followLabel = "Suivre" }: Props) {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  async function toggle() {
    const res = await api<{ following: boolean }>(`/users/${userId}/follow`, { method: "POST" });
    setFollowing(res.following);
    onChange?.(res.following);
    refresh();
  }

  async function click() {
    if (!user) return router.push("/login");
    if (confirm) return setAsking(true);
    setBusy(true);
    try {
      await toggle();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const label = following ? "Abonné" : followLabel;
  let button;
  if (variant === "button") {
    button = (
      <button onClick={click} disabled={busy} className={following ? "btn-ghost" : "btn-primary"}>
        {label}
      </button>
    );
  } else if (variant === "pill") {
    button = (
      <button
        onClick={click}
        disabled={busy}
        aria-label={confirm ? (following ? `Abonné à ${confirm.name}, se désabonner` : `${label} ${confirm.name}`) : undefined}
        className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
          following ? "bg-field text-ink hover:bg-line" : "bg-brand text-white hover:bg-brand-dark"
        }`}
      >
        {label}
      </button>
    );
  } else {
    button = (
      <button
        onClick={click}
        disabled={busy}
        className={`text-xs font-medium ${following ? "text-muted" : "text-brand"} disabled:opacity-50`}
      >
        {label}
      </button>
    );
  }

  return (
    <>
      {button}
      {asking && confirm && (
        <ConfirmDialog
          tone={following ? "danger" : "primary"}
          title={following ? `Te désabonner de ${confirm.name} ?` : `Suivre ${confirm.name} ?`}
          description={
            following
              ? "Tu ne verras plus ses publications réservées aux abonnés."
              : "Tu verras aussi ses publications réservées aux abonnés."
          }
          confirmLabel={following ? "Se désabonner" : followLabel}
          onConfirm={async () => {
            await toggle();
            setAsking(false);
          }}
          onCancel={() => setAsking(false)}
        >
          <Avatar src={confirm.avatar} name={confirm.name} size={56} />
        </ConfirmDialog>
      )}
    </>
  );
}
