"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function AuthField({ label, type = "text", id, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;
  const isPassword = type === "password";

  return (
    <div className="group">
      <label htmlFor={inputId} className="text-xs text-muted transition group-focus-within:text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={isPassword && visible ? "text" : type}
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
    </div>
  );
}
