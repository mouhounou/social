"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import ProfileForm from "@/components/profile/ProfileForm";
import { api } from "@/lib/api";

export default function SettingsPage() {
  return (
    <RequireAuth>
      {(user) => (
        <div className="mx-auto space-y-6">
          <h1 className="text-lg font-semibold">Paramètres</h1>
          <section className="card overflow-hidden">
            <ProfileForm key={user._id} user={user} />
          </section>
          <PasswordForm />
        </div>
      )}
    </RequireAuth>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setMessage({ ok: false, text: "Les deux mots de passe ne correspondent pas" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api("/users/me/password", {
        method: "PATCH",
        body: { currentPassword: current, newPassword: next },
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage({ ok: true, text: "Mot de passe mis à jour" });
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <KeyRound className="size-5 text-brand" />
        <h2 className="font-semibold">Mot de passe</h2>
      </div>
      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="Mot de passe actuel"
        autoComplete="current-password"
        className="input rounded-xl"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="Nouveau mot de passe"
          autoComplete="new-password"
          minLength={6}
          className="input rounded-xl"
          required
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirmer"
          autoComplete="new-password"
          minLength={6}
          className="input rounded-xl"
          required
        />
      </div>
      {message && <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-500"}`}>{message.text}</p>}
      <div className="flex justify-end">
        <button disabled={saving} className="btn-primary">
          {saving ? "Enregistrement…" : "Changer le mot de passe"}
        </button>
      </div>
    </form>
  );
}
