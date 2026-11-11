"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import { api } from "@/lib/api";
import { setRecovery } from "@/utils/recovery";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
      <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Retour à la connexion
      </Link>
      <h1 className="text-3xl font-semibold">Mot de passe oublié ?</h1>
      <p className="mt-2 text-sm text-muted">
        Entre l&apos;email de ton compte, on t&apos;envoie un code à 6 chiffres pour le récupérer.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <AuthField label="Email" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? "Envoi…" : "Envoyer le code"}
        </button>
      </form>
    </>
  );
}
