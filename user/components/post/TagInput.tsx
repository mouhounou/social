"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { MAX_TAGS, MAX_TAG_LENGTH, parseTags } from "@/lib/tags";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  autoFocus?: boolean;
};

export default function TagInput({ value, onChange, autoFocus = false }: Props) {
  const [draft, setDraft] = useState("");
  const full = value.length >= MAX_TAGS;

  function add(raw: string) {
    const next = [...new Set([...value, ...parseTags(raw)])].slice(0, MAX_TAGS);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      // Entrée ne doit jamais envoyer le formulaire depuis ce champ.
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-brand-soft py-1 pr-1.5 pl-3 text-sm font-medium text-brand"
          >
            #{tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Retirer le tag ${tag}`}
              className="rounded-full p-0.5 hover:bg-brand/15"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}

        {!full && (
          <div className="flex min-w-40 flex-1 items-center gap-1 rounded-full bg-field py-1 pr-1 pl-3">
            <span className="text-muted">#</span>
            <input
              autoFocus={autoFocus}
              value={draft}
              onChange={(e) => (/[\s,]/.test(e.target.value) ? add(e.target.value) : setDraft(e.target.value.replace(/^#+/, "")))}
              onKeyDown={onKeyDown}
              onBlur={() => draft && add(draft)}
              placeholder="Ajoute un tag"
              aria-label="Ajouter un tag"
              maxLength={MAX_TAG_LENGTH}
              enterKeyHint="done"
              autoCapitalize="none"
              className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={() => add(draft)}
              disabled={!parseTags(draft).length}
              aria-label="Ajouter le tag"
              className="rounded-full bg-brand p-1.5 text-white disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {value.length}/{MAX_TAGS} tags{full ? " · maximum atteint" : " · Entrée pour ajouter"}
      </p>
    </div>
  );
}
