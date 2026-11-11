"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AtSign, BookOpen, Lock, Mail, PenLine, User as UserIcon } from "lucide-react";
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
      <h1 className="text-3xl font-semibold">Crée ton compte</h1>
      <p className="mt-2 text-sm text-muted">Ça prend moins d&apos;une minute.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {roles.map(({ value, label, hint, icon: Icon }) => (
            <button
              type="button"
              key={value}
              onClick={() => setRole(value)}
              className={`rounded-2xl border-2 p-4 text-left transition ${
                role === value ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40"
              }`}
            >
              <Icon className={`size-5 ${role === value ? "text-brand" : "text-muted"}`} />
              <p className="mt-2 text-sm font-semibold">{label}</p>
              <p className="text-[11px] text-muted">{hint}</p>
            </button>
          ))}
        </div>

        <AuthField label="Nom complet" icon={UserIcon} value={form.name} onChange={update("name")} required />
        <AuthField
          label="Nom d'utilisateur"
          icon={AtSign}
          value={form.username}
          onChange={update("username")}
          pattern="[a-zA-Z0-9_.]{3,30}"
          title="3 à 30 caractères : lettres, chiffres, _ ou ."
          required
        />
        <AuthField label="Email" icon={Mail} type="email" value={form.email} onChange={update("email")} required />
        <AuthField
          label="Mot de passe"
          icon={Lock}
          type="password"
          value={form.password}
          onChange={update("password")}
          minLength={6}
          autoComplete="new-password"
          required
        />

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-brand">
          Connecte-toi
        </Link>
      </p>
    </>
  );
}
