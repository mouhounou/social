"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import { api } from "@/lib/api";
import { setRecovery } from "@/utils/recovery";
import { emailError, focusField } from "@/utils/validation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const invalid = emailError(email);
    setFieldError(invalid);
    setError("");
    if (invalid) return focusField(e.currentTarget, "email");

    setLoading(true);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setRecovery({ email: email.trim().toLowerCase() });
      router.push("/verify-otp");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <>
      <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-xs text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Retour à la connexion
      </Link>
      <h1 className="text-center text-3xl font-bold tracking-tight">Mot de passe oublié ?</h1>
      <p className="mt-2 text-center text-xs text-muted">
        Entre l&apos;email de ton compte, on t&apos;envoie un code à 6 chiffres pour le récupérer.
      </p>

      <form onSubmit={submit} noValidate className="mt-10 space-y-6">
        <AuthField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(emailError(e.target.value));
          }}
          error={fieldError}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
        />
        {error && <p className="alert-error">{error}</p>}
        <button disabled={loading} className="btn-dark w-full py-3.5">
          {loading ? "Envoi…" : "Envoyer le code"}
        </button>
      </form>
    </>
  );
}
