"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { getRecovery, setRecovery } from "@/utils/recovery";

const LENGTH = 6;
const RESEND_DELAY = 60;

const noSubscribe = () => () => {};
const recoveryEmail = () => getRecovery()?.email ?? "";
const noEmailOnServer = () => "";

export default function VerifyOtpPage() {
  const router = useRouter();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const email = useSyncExternalStore(noSubscribe, recoveryEmail, noEmailOnServer);
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_DELAY);

  useEffect(() => {
    if (!getRecovery()?.email) {
      router.replace("/forgot-password");
      return;
    }
    inputs.current[0]?.focus();
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function update(next: string[], focus: number) {
    setDigits(next);
    inputs.current[Math.min(focus, LENGTH - 1)]?.focus();
    if (next.every(Boolean)) submit(next.join(""));
  }

  function fill(index: number, value: string) {
    let clean = value.replace(/\D/g, "");
    const current = digits[index];
    if (current && clean.length === 2 && clean.includes(current)) {
      clean = clean[0] === current ? clean[1] : clean[0];
    }
    if (!clean) {
      if (!value) update(Object.assign([...digits], { [index]: "" }), index);
      return;
    }
    if (clean.length >= LENGTH) return paste(clean);

    const next = [...digits];
    clean
      .slice(0, LENGTH - index)
      .split("")
      .forEach((d, i) => (next[index + i] = d));
    update(next, index + clean.length);
  }

  function paste(text: string) {
    const clean = text.replace(/\D/g, "").slice(0, LENGTH);
    if (!clean) return;
    const next = Array.from({ length: LENGTH }, (_, i) => clean[i] ?? "");
    update(next, clean.length);
  }

  function onKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  async function submit(value?: string) {
    const code = value ?? digits.join("");
    if (code.length < LENGTH || loading) return;

    setError("");
    setLoading(true);
    try {
      const { resetToken } = await api<{ resetToken: string }>("/auth/verify-otp", {
        method: "POST",
        body: { email, code },
      });
      setRecovery({ email, resetToken });
      router.push("/reset-password");
    } catch (err) {
      setError((err as Error).message);
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
      setLoading(false);
    }
  }

  async function resend() {
    setError("");
    setInfo("");
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setInfo("Nouveau code envoyé.");
      setCooldown(RESEND_DELAY);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <Link href="/forgot-password" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Changer d&apos;email
      </Link>
      <h1 className="text-3xl font-semibold">Vérifie tes emails</h1>
      <p className="mt-2 text-sm text-muted">
        On a envoyé un code à <span className="font-medium text-ink">{email}</span>. Il est valable 10 minutes.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-8 space-y-6"
      >
        <div className="flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChange={(e) => fill(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={(e) => {
                e.preventDefault();
                paste(e.clipboardData.getData("text"));
              }}
              onFocus={(e) => e.target.select()}
              aria-label={`Chiffre ${i + 1}`}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={LENGTH}
              className="size-12 rounded-xl bg-field text-center text-xl font-semibold outline-none focus:ring-2 focus:ring-brand sm:size-14"
            />
          ))}
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {info && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</p>}

        <button disabled={loading || digits.join("").length < LENGTH} className="btn-primary w-full py-3.5">
          {loading ? "Vérification…" : "Vérifier"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Rien reçu ?{" "}
        {cooldown > 0 ? (
          <span>Renvoyer dans {cooldown}s</span>
        ) : (
          <button onClick={resend} className="font-medium text-brand">
            Renvoyer le code
          </button>
        )}
      </p>
    </>
  );
}
