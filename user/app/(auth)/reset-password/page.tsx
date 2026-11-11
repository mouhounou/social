"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthField from "@/components/auth/AuthField";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { clearRecovery, getRecovery } from "@/utils/recovery";
import type { User } from "@/types";

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
      <h1 className="text-center text-3xl font-bold tracking-tight">Nouveau mot de passe</h1>
      <p className="mt-2 text-center text-xs text-muted">Choisis un mot de passe d&apos;au moins 6 caractères.</p>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <AuthField
          label="Nouveau mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          autoComplete="new-password"
          required
        />
        <AuthField
          label="Confirmer"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          autoComplete="new-password"
          required
        />
        {error && <p className="alert-error">{error}</p>}
        <button disabled={loading} className="btn-dark w-full py-3.5">
          {loading ? "Enregistrement…" : "Réinitialiser"}
        </button>
      </form>
    </>
  );
}
