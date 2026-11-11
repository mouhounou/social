"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthField from "@/components/auth/AuthField";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await api<{ user: User }>("/auth/login", {
        method: "POST",
        body: { identifier, password },
      });
      setUser(user);
      router.replace(safeNext());
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-center text-3xl font-bold tracking-tight">Content de te revoir</h1>
      <p className="mt-2 text-center text-xs text-muted">Connecte-toi pour retrouver ton fil.</p>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <AuthField
          label="Email ou nom d'utilisateur"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
        />
        <AuthField
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="text-xs text-muted hover:text-ink">
            Mot de passe oublié ?
          </Link>
        </div>

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
