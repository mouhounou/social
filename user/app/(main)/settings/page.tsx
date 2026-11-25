"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import ProfileForm from "@/components/profile/ProfileForm";
import FieldError from "@/components/ui/FieldError";
import { api, type ApiError } from "@/lib/api";
import { PASSWORD_MIN, collectErrors, focusField, passwordError } from "@/utils/validation";

type PasswordField = "current" | "next" | "confirm";

// Nom du champ côté API -> champ du formulaire.
const apiFields: Record<string, PasswordField> = { currentPassword: "current", newPassword: "next" };

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
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const clear = (field: PasswordField) => setErrors((errs) => ({ ...errs, [field]: "" }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const { errors: found, first } = collectErrors<PasswordField>({
      current: current ? "" : "Indique ton mot de passe actuel",
      next: passwordError(next),
      confirm: !confirm
        ? "Confirme ton nouveau mot de passe"
        : confirm !== next
          ? "Les deux mots de passe ne correspondent pas"
          : "",
    });
    setErrors(found);
    setMessage(null);
    if (first) return focusField(formEl, first);

    setSaving(true);
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
      const { message: text, field = "" } = err as ApiError;
      const target = apiFields[field];
      if (target) {
        setErrors({ [target]: text });
        focusField(formEl, target);
      } else setMessage({ ok: false, text });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <KeyRound className="size-5 text-brand" />
        <h2 className="font-semibold">Mot de passe</h2>
      </div>
      <div>
        <input
          type="password"
          name="current"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            clear("current");
          }}
          placeholder="Mot de passe actuel"
          aria-label="Mot de passe actuel"
          aria-invalid={errors.current ? true : undefined}
          autoComplete="current-password"
          className="input rounded-xl"
        />
        <FieldError>{errors.current}</FieldError>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <input
            type="password"
            name="next"
            value={next}
            onChange={(e) => {
              setNext(e.target.value);
              clear("next");
            }}
            placeholder={`Nouveau mot de passe (${PASSWORD_MIN} caractères min.)`}
            aria-label="Nouveau mot de passe"
            aria-invalid={errors.next ? true : undefined}
            autoComplete="new-password"
            className="input rounded-xl"
          />
          <FieldError>{errors.next}</FieldError>
        </div>
        <div>
          <input
            type="password"
            name="confirm"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              clear("confirm");
            }}
            placeholder="Confirmer"
            aria-label="Confirmer le nouveau mot de passe"
            aria-invalid={errors.confirm ? true : undefined}
            autoComplete="new-password"
            className="input rounded-xl"
          />
          <FieldError>{errors.confirm}</FieldError>
        </div>
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
