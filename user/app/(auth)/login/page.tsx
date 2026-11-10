"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AtSign, Lock } from "lucide-react";
import AuthField from "@/components/AuthField";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

function safeNext() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
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
      <h1 className="text-3xl font-semibold">Content de te revoir</h1>
      <p className="mt-2 text-sm text-muted">Connecte-toi pour retrouver ton fil.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <AuthField
          label="Email ou nom d'utilisateur"
          icon={AtSign}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
        />
        <AuthField
          label="Mot de passe"
          icon={Lock}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-brand">
            Mot de passe oublié ?
          </Link>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-brand">
          Inscris-toi
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link href="/" className="text-muted hover:text-ink">
          Continuer sans compte
        </Link>
      </p>
    </>
  );
}
