"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import FieldError from "@/components/ui/FieldError";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: React.ReactNode;
};

export default function AuthField({ label, type = "text", id, error, hint, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  const isPassword = type === "password";

  return (
    <div className="group">
      <label
        htmlFor={inputId}
        className={`text-xs transition ${error ? "text-red-600" : "text-muted group-focus-within:text-ink"}`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? noteId : undefined}
          className={`line-input ${isPassword ? "pr-9" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute top-1/2 right-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:text-ink"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <FieldError id={noteId}>{error}</FieldError>
      ) : (
        hint && (
          <p id={noteId} className="mt-1.5 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
