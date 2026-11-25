"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthField from "@/components/auth/AuthField";
import { useAuth } from "@/hooks/useAuth";
import { api, type ApiError } from "@/lib/api";
import { clearRecovery, getRecovery } from "@/utils/recovery";
import { PASSWORD_MIN, collectErrors, focusField, passwordError } from "@/utils/validation";
import type { User } from "@/types";

type Errors = { password?: string; confirm?: string };

function check(password: string, confirm: string) {
  return {
    password: passwordError(password),
    confirm: !confirm
      ? "Confirme ton mot de passe"
      : confirm !== password
        ? "Les deux mots de passe ne correspondent pas"
        : "",
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getRecovery()?.resetToken) router.replace("/forgot-password");
  }, [router]);

  // Les champs déjà signalés en rouge sont revérifiés pendant la saisie.
  function recheck(nextPassword: string, nextConfirm: string) {
    const fresh = check(nextPassword, nextConfirm);
    setErrors((errs) => ({
      password: errs.password && fresh.password,
      confirm: errs.confirm && fresh.confirm,
    }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const { errors: found, first } = collectErrors(check(password, confirm));
    setErrors(found);
    setError("");
    if (first) return focusField(formEl, first);

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
      const { message, field } = err as ApiError;
      setLoading(false);
      if (field !== "password") return setError(message);
      setErrors({ password: message });
      focusField(formEl, "password");
    }
  }

  return (
    <>
      <h1 className="text-center text-3xl font-bold tracking-tight">Nouveau mot de passe</h1>
      <p className="mt-2 text-center text-xs text-muted">Choisis un mot de passe d&apos;au moins {PASSWORD_MIN} caractères.</p>

      <form onSubmit={submit} noValidate className="mt-10 space-y-6">
        <AuthField
          label="Nouveau mot de passe"
          name="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            recheck(e.target.value, confirm);
          }}
          error={errors.password}
          autoComplete="new-password"
        />
        <AuthField
          label="Confirmer"
          name="confirm"
          type="password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            recheck(password, e.target.value);
          }}
          error={errors.confirm}
          autoComplete="new-password"
        />
        {error && <p className="alert-error">{error}</p>}
        <button disabled={loading} className="btn-dark w-full py-3.5">
          {loading ? "Enregistrement…" : "Réinitialiser"}
        </button>
      </form>
    </>
  );
}
