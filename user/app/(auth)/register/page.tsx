"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, PenLine } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Role, User } from "@/types";

const roles = [
  { value: "reader", label: "Lecteur", hint: "Je lis, j'aime et je commente", icon: BookOpen },
  { value: "author", label: "Auteur", hint: "Je publie aussi mes créations", icon: PenLine },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [role, setRole] = useState<Role>("reader");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await api<{ user: User }>("/auth/register", {
        method: "POST",
        body: { ...form, role },
      });
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
      <h1 className="text-center text-3xl font-bold tracking-tight">Crée ton compte</h1>
      <p className="mt-2 text-center text-xs text-muted">Ça prend moins d&apos;une minute.</p>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {roles.map(({ value, label, hint, icon: Icon }) => (
            <button
              type="button"
              key={value}
              onClick={() => setRole(value)}
              className={`rounded-2xl border p-3.5 text-left transition ${
                role === value ? "border-ink bg-slate-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-lg transition ${
                  role === value ? "bg-ink text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <Icon className="size-4" />
              </span>
              <p className="mt-2 text-sm font-semibold">{label}</p>
              <p className="text-[11px] text-muted">{hint}</p>
            </button>
          ))}
        </div>

        <AuthField label="Nom complet" value={form.name} onChange={update("name")} required />
        <AuthField
          label="Nom d'utilisateur"
          value={form.username}
          onChange={update("username")}
          pattern="[a-zA-Z0-9_.]{3,30}"
          title="3 à 30 caractères : lettres, chiffres, _ ou ."
          required
        />
        <AuthField label="Email" type="email" value={form.email} onChange={update("email")} required />
        <AuthField
          label="Mot de passe"
          type="password"
          value={form.password}
          onChange={update("password")}
          minLength={6}
          autoComplete="new-password"
          required
        />

        {error && <p className="alert-error">{error}</p>}

        <button disabled={loading} className="btn-dark w-full py-3.5">
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-10 text-center text-xs text-muted">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Connecte-toi
        </Link>
      </p>
    </>
  );
}
