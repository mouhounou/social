"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BookOpen, PenLine } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import Turnstile, { type TurnstileHandle } from "@/components/auth/Turnstile";
import { useAuth } from "@/hooks/useAuth";
import { api, type ApiError } from "@/lib/api";
import {
  PASSWORD_MIN,
  USERNAME_HINT,
  collectErrors,
  emailError,
  focusField,
  nameError,
  normalizeUsername,
  passwordError,
  usernameError,
} from "@/utils/validation";
import type { Role, User } from "@/types";

const roles = [
  { value: "reader", label: "Lecteur", hint: "Je lis, j'aime et je commente", icon: BookOpen },
  { value: "author", label: "Auteur", hint: "Je publie aussi mes créations", icon: PenLine },
] as const;

type Field = "name" | "username" | "email" | "password";

const validators: Record<Field, (value: string) => string> = {
  name: nameError,
  username: usernameError,
  email: emailError,
  password: passwordError,
};

const isField = (field?: string): field is Field => !!field && field in validators;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState<Record<Field, string>>({ name: "", username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [role, setRole] = useState<Role>("reader");
  const [error, setError] = useState("");
  const [robotError, setRobotError] = useState("");
  const [loading, setLoading] = useState(false);
  const turnstile = useRef<TurnstileHandle>(null);

  // Un champ signalé en rouge est revérifié à chaque frappe : le rouge part dès que la saisie est bonne.
  const update = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: validators[field](value) }));
  };

  const blur = (field: Field) => () => {
    const value = form[field];
    if (field === "username") setForm((f) => ({ ...f, username: normalizeUsername(value) }));
    if (value.trim()) setErrors((errs) => ({ ...errs, [field]: validators[field](value) }));
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const values = {
      name: form.name.trim(),
      username: normalizeUsername(form.username),
      email: form.email.trim(),
      password: form.password,
    };
    const { errors: found, first } = collectErrors({
      name: nameError(form.name),
      username: usernameError(form.username),
      email: emailError(form.email),
      password: passwordError(form.password),
    });

    setForm(values);
    setErrors(found);
    setError("");
    setRobotError("");
    if (first) return focusField(formEl, first);

    setLoading(true);
    try {
      const { user } = await api<{ user: User }>("/auth/register", {
        method: "POST",
        body: { ...values, role, ...(await turnstile.current?.payload()) },
      });
      setUser(user);
      router.replace("/");
      router.refresh();
    } catch (err) {
      const { message, field } = err as ApiError;
      setLoading(false);
      turnstile.current?.reset();
      if (field === "turnstile") return setRobotError(message);
      if (!isField(field)) return setError(message);
      setErrors({ [field]: message });
      focusField(formEl, field);
    }
  }

  const handle = normalizeUsername(form.username);

  return (
    <>
      <h1 className="text-center text-3xl font-bold tracking-tight">Crée ton compte</h1>
      <p className="mt-2 text-center text-xs text-muted">Ça prend moins d&apos;une minute.</p>

      <form onSubmit={submit} noValidate className="mt-10 space-y-6">
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

        <AuthField
          label="Nom complet"
          name="name"
          value={form.name}
          onChange={update("name")}
          onBlur={blur("name")}
          error={errors.name}
          maxLength={60}
          autoComplete="name"
        />
        <AuthField
          label="Nom d'utilisateur"
          name="username"
          value={form.username}
          onChange={update("username")}
          onBlur={blur("username")}
          error={errors.username}
          hint={
            handle && handle !== form.username ? (
              <>
                Ton identifiant sera <span className="font-medium text-ink">@{handle}</span>
              </>
            ) : (
              USERNAME_HINT
            )
          }
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <AuthField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={update("email")}
          onBlur={blur("email")}
          error={errors.email}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <AuthField
          label="Mot de passe"
          name="password"
          type="password"
          value={form.password}
          onChange={update("password")}
          onBlur={blur("password")}
          error={errors.password}
          hint={`${PASSWORD_MIN} caractères minimum, à toi de choisir`}
          autoComplete="new-password"
        />

        <Turnstile ref={turnstile} action="signup" error={robotError} />

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
