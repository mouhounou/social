"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { DEFAULT_COVER } from "@/lib/images";
import type { User } from "@/lib/types";

type Props = {
  user: User;
  onSaved?: (user: User) => void;
  onCancel?: () => void;
};

type ImageState = { file: File | null; remove: boolean };

function usePreview(current: string | null, state: ImageState) {
  return useMemo(() => {
    if (state.file) return URL.createObjectURL(state.file);
    return state.remove ? null : current;
  }, [current, state]);
}

export default function ProfileForm({ user, onSaved, onCancel }: Props) {
  const { setUser } = useAuth();
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user.name,
    username: user.username,
    bio: user.bio,
    location: user.location ?? "",
    website: user.website ?? "",
  });
  const [avatar, setAvatar] = useState<ImageState>({ file: null, remove: false });
  const [cover, setCover] = useState<ImageState>({ file: null, remove: false });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const avatarPreview = usePreview(user.avatar, avatar);
  const coverPreview = usePreview(user.cover, cover);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const data = new FormData();
    for (const [key, value] of Object.entries(form)) data.append(key, value.trim());
    if (avatar.file) data.append("avatar", avatar.file);
    if (cover.file) data.append("cover", cover.file);
    if (avatar.remove) data.append("removeAvatar", "true");
    if (cover.remove) data.append("removeCover", "true");

    try {
      const res = await api<{ user: User }>("/users/me", { method: "PATCH", body: data });
      setUser(res.user);
      setAvatar({ file: null, remove: false });
      setCover({ file: null, remove: false });
      setMessage({ ok: true, text: "Profil mis à jour" });
      onSaved?.(res.user);
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="relative h-36 bg-[#F3ECE3] sm:h-44">
        <Image
          src={coverPreview || DEFAULT_COVER}
          alt=""
          fill
          unoptimized={!coverPreview || coverPreview.startsWith("blob:")}
          className="object-cover"
          sizes="640px"
        />
        <div className="absolute right-3 bottom-3 flex gap-2">
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/75"
          >
            <Camera className="size-4" /> Couverture
          </button>
          {coverPreview && (
            <button
              type="button"
              onClick={() => setCover({ file: null, remove: true })}
              aria-label="Retirer la couverture"
              className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/75"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setCover({ file, remove: false });
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-5 px-5 pb-5">
        <div className="-mt-11 flex items-end gap-3">
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            className="group relative rounded-full"
            aria-label="Changer la photo de profil"
          >
            <Avatar src={avatarPreview} name={form.name} size={92} className="ring-4 ring-white" />
            <span className="absolute inset-1 flex items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition group-hover:opacity-100">
              <Camera className="size-5" />
            </span>
          </button>
          {avatarPreview && (
            <button
              type="button"
              onClick={() => setAvatar({ file: null, remove: true })}
              className="mb-2 text-xs font-medium text-muted hover:text-red-500"
            >
              Retirer la photo
            </button>
          )}
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setAvatar({ file, remove: false });
              e.target.value = "";
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom">
            <input value={form.name} onChange={update("name")} className="input rounded-xl" maxLength={60} required />
          </Field>
          <Field label="Nom d'utilisateur">
            <input
              value={form.username}
              onChange={update("username")}
              className="input rounded-xl"
              pattern="[a-zA-Z0-9_.]{3,30}"
              title="3 à 30 caractères : lettres, chiffres, _ ou ."
              required
            />
          </Field>
        </div>

        <Field label="Bio" hint={`${form.bio.length}/160`}>
          <textarea
            value={form.bio}
            onChange={update("bio")}
            maxLength={160}
            rows={3}
            placeholder="Parle un peu de toi"
            className="input resize-none rounded-xl"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ville">
            <input value={form.location} onChange={update("location")} maxLength={60} placeholder="Kinshasa, RDC" className="input rounded-xl" />
          </Field>
          <Field label="Site web">
            <input
              type="url"
              value={form.website}
              onChange={update("website")}
              maxLength={120}
              placeholder="https://"
              className="input rounded-xl"
            />
          </Field>
        </div>

        {message && <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-500"}`}>{message.text}</p>}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-ghost">
              Annuler
            </button>
          )}
          <button disabled={saving} className="btn-primary">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="flex justify-between text-sm font-medium">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
