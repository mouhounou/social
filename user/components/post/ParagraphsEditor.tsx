"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Link2, Plus, Trash2, Upload, X } from "lucide-react";
import type { Media, Paragraph } from "@/types";
import MediaView from "@/components/post/MediaView";
import {
  MAX_PARAGRAPHS,
  MEDIA_ACCEPT,
  PROVIDER_NAMES,
  checkMediaFile,
  mediaKind,
  parseLink,
  videoEmbed,
} from "@/lib/media";

type Source = "none" | "device" | "link";

export type ParagraphDraft = {
  key: string;
  title: string;
  description: string;
  source: Source;
  /** Média déjà enregistré (modification) : gardé tant qu'on ne le remplace pas. */
  kept: Media | null;
  file: File | null;
  preview: string | null;
  link: string;
  linkType: "image" | "video";
  error: string;
};

let lastKey = 0;

export function newParagraph(p?: Paragraph): ParagraphDraft {
  return {
    key: `paragraphe-${++lastKey}`,
    title: p?.title ?? "",
    description: p?.description ?? "",
    source: p?.media ? (p.media.link ? "link" : "device") : "none",
    kept: p?.media ?? null,
    file: null,
    preview: null,
    link: p?.media?.link ?? "",
    linkType: p?.media?.type ?? "image",
    error: "",
  };
}

function mediaSpec(p: ParagraphDraft, files: File[]) {
  if (p.source === "device") {
    if (p.file) {
      files.push(p.file);
      return { file: files.length - 1 };
    }
    return p.kept && !p.kept.link ? { url: p.kept.url } : null;
  }
  if (p.source === "link") {
    const link = p.link.trim();
    if (!link) return null;
    // Lien inchangé : on garde le média déjà récupéré au lieu de le copier une seconde fois.
    const unchanged = p.kept?.link === link && (p.kept.provider !== "cloudinary" || p.kept.type === p.linkType);
    return unchanged ? { url: p.kept!.url } : { link, type: p.linkType };
  }
  return null;
}

/** Champ `paragraphs` de la requête, et les fichiers à joindre dans `media`, dans l'ordre des index. */
export function serializeParagraphs(list: ParagraphDraft[]) {
  const files: File[] = [];
  const paragraphs = list.map((p) => ({
    title: p.title.trim(),
    description: p.description.trim(),
    media: mediaSpec(p, files),
  }));
  return { paragraphs, files };
}

export function releaseParagraph(p: ParagraphDraft) {
  if (p.preview) URL.revokeObjectURL(p.preview);
}

type Props = {
  value: ParagraphDraft[];
  onChange: (list: ParagraphDraft[]) => void;
  /** Paragraphe refusé par l'API, encadré en rouge. */
  invalid: number | null;
};

export default function ParagraphsEditor({ value, onChange, invalid }: Props) {
  const [focusKey, setFocusKey] = useState<string | null>(null);

  function update(i: number, patch: Partial<ParagraphDraft>) {
    onChange(value.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  function move(i: number, step: number) {
    const next = [...value];
    [next[i], next[i + step]] = [next[i + step], next[i]];
    onChange(next);
  }

  function remove(i: number) {
    releaseParagraph(value[i]);
    onChange(value.filter((_, j) => j !== i));
  }

  function add() {
    const p = newParagraph();
    setFocusKey(p.key);
    onChange([...value, p]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">
          Paragraphes <span className="font-normal text-muted">(facultatif)</span>
        </p>
        {value.length > 0 && (
          <span className="text-xs text-muted">
            {value.length}/{MAX_PARAGRAPHS}
          </span>
        )}
      </div>

      {value.map((p, i) => (
        <ParagraphFields
          key={p.key}
          index={i}
          count={value.length}
          paragraph={p}
          invalid={invalid === i}
          autoFocus={p.key === focusKey}
          onChange={(patch) => update(i, patch)}
          onMove={(step) => move(i, step)}
          onRemove={() => remove(i)}
        />
      ))}

      {value.length < MAX_PARAGRAPHS && (
        <button
          type="button"
          onClick={add}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-4 text-sm text-muted hover:border-brand hover:text-brand"
        >
          <Plus className="size-4" /> Ajouter un paragraphe
        </button>
      )}
    </div>
  );
}

const SOURCES: { value: Source; label: string; short: string }[] = [
  { value: "none", label: "Aucun média", short: "Aucun" },
  { value: "device", label: "Depuis l'appareil", short: "Appareil" },
  { value: "link", label: "Par un lien", short: "Lien" },
];

type FieldsProps = {
  index: number;
  count: number;
  paragraph: ParagraphDraft;
  invalid: boolean;
  autoFocus: boolean;
  onChange: (patch: Partial<ParagraphDraft>) => void;
  onMove: (step: number) => void;
  onRemove: () => void;
};

function ParagraphFields({ index, count, paragraph: p, invalid, autoFocus, onChange, onMove, onRemove }: FieldsProps) {
  const n = index + 1;
  const iconButton = "rounded-full p-1.5 text-muted hover:bg-field hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <fieldset
      id={`paragraphe-${index}`}
      aria-label={`Paragraphe ${n}`}
      className={`scroll-mt-24 space-y-3 rounded-2xl border p-4 ${invalid ? "border-red-400 ring-2 ring-red-100" : "border-line"}`}
    >
      <div className="flex items-center gap-1">
        <h3 className="text-sm font-semibold">Paragraphe {n}</h3>
        <div className="ml-auto flex items-center">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Monter le paragraphe ${n}`} className={iconButton}>
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === count - 1}
            aria-label={`Descendre le paragraphe ${n}`}
            className={iconButton}
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Supprimer le paragraphe ${n}`}
            className="rounded-full p-1.5 text-muted hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <input
        value={p.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Titre du paragraphe"
        aria-label={`Titre du paragraphe ${n}`}
        autoFocus={autoFocus}
        maxLength={150}
        required
        className="input rounded-2xl font-medium"
      />
      <textarea
        value={p.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Description"
        aria-label={`Description du paragraphe ${n}`}
        rows={4}
        maxLength={5000}
        className="input resize-y rounded-2xl"
      />

      <div role="group" aria-label={`Média du paragraphe ${n}`} className="flex gap-1 rounded-full bg-field p-1 text-xs sm:w-fit">
        {SOURCES.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={p.source === s.value}
            aria-label={s.label}
            onClick={() => onChange({ source: s.value, error: "" })}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium whitespace-nowrap transition sm:flex-none ${
              p.source === s.value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            <span className="sm:hidden">{s.short}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {p.source === "device" && <DevicePicker paragraph={p} onChange={onChange} />}
      {p.source === "link" && <LinkPicker paragraph={p} onChange={onChange} />}

      {p.error && <p className="text-sm text-red-500">{p.error}</p>}
    </fieldset>
  );
}

type PickerProps = { paragraph: ParagraphDraft; onChange: (patch: Partial<ParagraphDraft>) => void };

function DevicePicker({ paragraph: p, onChange }: PickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const saved = !p.file && p.kept && !p.kept.link ? p.kept : null;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const error = checkMediaFile(file);
    if (error) return onChange({ error });
    releaseParagraph(p);
    onChange({ file, preview: URL.createObjectURL(file), error: "" });
  }

  function clear() {
    releaseParagraph(p);
    onChange({ file: null, preview: null, kept: p.kept?.link ? p.kept : null });
  }

  return (
    <>
      {p.file && p.preview ? (
        <div className="relative">
          {mediaKind(p.file) === "video" ? (
            <video src={p.preview} controls playsInline className="max-h-80 w-full rounded-2xl bg-black" />
          ) : (
            <Image src={p.preview} alt="" width={800} height={500} unoptimized className="max-h-80 w-full rounded-2xl bg-field object-contain" />
          )}
          <RemoveButton onClick={clear} />
        </div>
      ) : saved ? (
        <div className="relative">
          <MediaView media={saved} title={p.title} />
          <RemoveButton onClick={clear} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-line py-8 text-sm text-muted hover:border-brand hover:text-brand"
        >
          <Upload className="size-5" />
          Choisir une image ou une vidéo
          <span className="text-xs">Image : 5 Mo max · Vidéo MP4, WebM ou MOV : 50 Mo max</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept={MEDIA_ACCEPT} hidden onChange={pick} />
    </>
  );
}

function LinkPicker({ paragraph: p, onChange }: PickerProps) {
  const link = p.link.trim();
  const embed = videoEmbed(link);
  const valid = !!parseLink(link);
  const saved = p.kept?.provider === "cloudinary" && p.kept.link === link && p.kept.type === p.linkType ? p.kept : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            type="url"
            inputMode="url"
            value={p.link}
            onChange={(e) => onChange({ link: e.target.value, error: "" })}
            placeholder="https://…"
            aria-label="Lien du média"
            maxLength={2048}
            className="input rounded-2xl pl-10"
          />
        </div>
        {!embed && (
          <select
            value={p.linkType}
            onChange={(e) => onChange({ linkType: e.target.value as ParagraphDraft["linkType"] })}
            aria-label="Type de média"
            className="input rounded-2xl sm:w-32"
          >
            <option value="image">Image</option>
            <option value="video">Vidéo</option>
          </select>
        )}
      </div>

      <p className="text-xs text-muted">
        {embed
          ? `Vidéo ${PROVIDER_NAMES[embed.provider]} : elle sera lue dans son lecteur.`
          : "Une vidéo YouTube, Vimeo ou Dailymotion, ou le lien direct d'une image ou d'une vidéo (MP4, WebM, MOV) : le fichier est alors copié sur Solola."}
      </p>

      {embed ? (
        <MediaView media={{ type: "video", provider: embed.provider, url: embed.url, link }} title={p.title} />
      ) : saved ? (
        <MediaView media={saved} title={p.title} />
      ) : (
        valid && <LinkPreview key={`${p.linkType}:${link}`} link={link} type={p.linkType} />
      )}
    </div>
  );
}

function LinkPreview({ link, type }: { link: string; type: "image" | "video" }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <p className="rounded-2xl bg-field px-4 py-3 text-xs text-muted">
        Aperçu impossible : le lien doit mener directement {type === "image" ? "à une image" : "à un fichier vidéo"}.
        {type === "image" && " Sur la plupart des sites, un clic droit sur l'image puis « Copier l'adresse de l'image » le donne."}
      </p>
    );
  }

  return type === "video" ? (
    <video src={link} controls playsInline preload="metadata" onError={() => setBroken(true)} className="max-h-80 w-full rounded-2xl bg-black" />
  ) : (
    <Image
      src={link}
      alt=""
      width={800}
      height={500}
      unoptimized
      onError={() => setBroken(true)}
      className="max-h-80 w-full rounded-2xl bg-field object-contain"
    />
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retirer le média"
      className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white"
    >
      <X className="size-4" />
    </button>
  );
}
