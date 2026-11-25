"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  title: string;
  description?: React.ReactNode;
  /** Affiché au-dessus du titre (un avatar, une icône…). */
  children?: React.ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  /** Peut être asynchrone : la fenêtre attend, puis affiche l'erreur s'il y en a une. */
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

/** Demande de confirmation, posée au-dessus de tout, y compris d'une autre fenêtre. */
export default function ConfirmDialog({ title, description, children, confirmLabel, tone = "primary", onConfirm, onCancel }: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cancel = useRef(onCancel);
  const busyRef = useRef(false);
  useEffect(() => {
    cancel.current = onCancel;
    busyRef.current = busy;
  });

  // Échap ferme seulement cette confirmation, pas la fenêtre qui est dessous.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (!busyRef.current) cancel.current();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        className="card w-full max-w-sm p-6 text-center shadow-xl"
      >
        {children && <div className="mb-3 flex justify-center">{children}</div>}
        <h2 id={`${id}-title`} className="text-base font-semibold">
          {title}
        </h2>
        {description && (
          <p id={`${id}-description`} className="mt-1.5 text-sm text-muted">
            {description}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-6 flex gap-3">
          {/* Pour une action qui retire quelque chose, le focus part sur « Annuler ». */}
          <button type="button" onClick={onCancel} disabled={busy} autoFocus={tone === "danger"} className="btn-ghost flex-1">
            Annuler
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            autoFocus={tone !== "danger"}
            className={`btn flex-1 text-white ${tone === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-brand hover:bg-brand-dark"}`}
          >
            {busy ? "Un instant…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
