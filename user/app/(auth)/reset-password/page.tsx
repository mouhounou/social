"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import AuthField from "@/components/AuthField";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { clearRecovery, getRecovery } from "@/lib/recovery";
import type { User } from "@/lib/types";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getRecovery()?.resetToken) router.replace("/forgot-password");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }

    const recovery = getRecovery();
    if (!recovery?.resetToken) return router.replace("/forgot-password");

    setError("");
    setLoading(true);
    try {
      const { user } = await api<{ user: User }>("/auth/reset-password", {
        method: "POST",
        body: { email: recovery.email, resetToken: recovery.resetToken, password },
      });
      clearRecovery();
      setUser(user);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-semibold">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-muted">Choisis un mot de passe d&apos;au moins 6 caractères.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <AuthField
          label="Nouveau mot de passe"
          icon={Lock}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          autoComplete="new-password"
          required
        />
        <AuthField
          label="Confirmer"
          icon={Lock}
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          autoComplete="new-password"
          required
        />
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? "Enregistrement…" : "Réinitialiser"}
        </button>
      </form>
    </>
  );
}
