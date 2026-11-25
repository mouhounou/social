"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import AuthField from "@/components/auth/AuthField";
import Turnstile, { type TurnstileHandle } from "@/components/auth/Turnstile";
import { useAuth } from "@/hooks/useAuth";
import { api, type ApiError } from "@/lib/api";
import { collectErrors, focusField } from "@/utils/validation";
import type { User } from "@/types";

function safeNext() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next) return "/";
  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [robotError, setRobotError] = useState("");
  const [loading, setLoading] = useState(false);
  const turnstile = useRef<TurnstileHandle>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { errors: found, first } = collectErrors({
      identifier: identifier.trim() ? "" : "Indique ton email ou ton nom d'utilisateur",
      password: password ? "" : "Indique ton mot de passe",
    });
    setErrors(found);
    setError("");
    setRobotError("");
    if (first) return focusField(e.currentTarget, first);

    setLoading(true);
    try {
      const { user } = await api<{ user: User }>("/auth/login", {
        method: "POST",
        body: { identifier, password, ...(await turnstile.current?.payload()) },
      });
      setUser(user);
      router.replace(safeNext());
      router.refresh();
    } catch (err) {
      const { message, field } = err as ApiError;
      turnstile.current?.reset();
      if (field === "turnstile") setRobotError(message);
      else setError(message);
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-center text-3xl font-bold tracking-tight">Content de te revoir</h1>
      <p className="mt-2 text-center text-xs text-muted">Connecte-toi pour retrouver ton fil.</p>

      <form onSubmit={submit} noValidate className="mt-10 space-y-6">
        <AuthField
          label="Email ou nom d'utilisateur"
          name="identifier"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setErrors((errs) => ({ ...errs, identifier: "" }));
          }}
          error={errors.identifier}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <AuthField
          label="Mot de passe"
          name="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((errs) => ({ ...errs, password: "" }));
          }}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="text-xs text-muted hover:text-ink">
            Mot de passe oublié ?
          </Link>
        </div>

        <Turnstile ref={turnstile} action="login" error={robotError} />

        {error && <p className="alert-error">{error}</p>}

        <button disabled={loading} className="btn-dark w-full py-3.5">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-10 text-center text-xs text-muted">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-ink hover:underline">
          Inscris-toi
        </Link>
      </p>
      <p className="mt-3 text-center text-xs">
        <Link href="/" className="text-muted hover:text-ink">
          Continuer sans compte
        </Link>
      </p>
    </>
  );
}
