"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
};

export default function AuthField({ label, icon: Icon, type = "text", ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <span className="relative block">
        <Icon className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <input {...props} type={isPassword && visible ? "text" : type} className="input rounded-xl py-3.5 pl-11" />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-muted"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </span>
    </label>
  );
}
