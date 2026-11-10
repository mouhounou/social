"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Camera } from "lucide-react";
import Avatar from "@/components/Avatar";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export default function SettingsPage() {
  const { user } = useAuth();
  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }
  return <SettingsForm user={user} />;
}

function SettingsForm({ user }: { user: User }) {
  const { setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const avatarPreview = useMemo(() => (avatar ? URL.createObjectURL(avatar) : user.avatar), [avatar, user.avatar]);
  const coverPreview = useMemo(() => (cover ? URL.createObjectURL(cover) : user.cover), [cover, user.cover]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const form = new FormData();
    form.append("name", name);
    form.append("username", username);
    form.append("bio", bio);
    if (avatar) form.append("avatar", avatar);
    if (cover) form.append("cover", cover);

    try {
      const res = await api<{ user: User }>("/users/me", { method: "PATCH", body: form });
      setUser(res.user);
      setAvatar(null);
      setCover(null);
      setMessage({ ok: true, text: "Profil mis à jour" });
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl overflow-hidden">
      <label className="group relative block h-40 cursor-pointer bg-gradient-to-r from-amber-100 via-orange-50 to-sky-100">
        {coverPreview && <Image src={coverPreview} alt="" fill unoptimized className="object-cover" />}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <Camera className="size-6" />
        </span>
        <input type="file" accept="image/*" hidden onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
      </label>

      <div className="space-y-5 px-6 pb-6">
        <label className="group relative -mt-12 block w-fit cursor-pointer">
          {avatar ? (
            <Image src={avatarPreview!} alt="" width={96} height={96} unoptimized className="size-24 rounded-full object-cover ring-4 ring-white" />
          ) : (
            <Avatar src={user.avatar} name={user.name} size={96} className="ring-4 ring-white" />
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition group-hover:opacity-100">
            <Camera className="size-5" />
          </span>
          <input type="file" accept="image/*" hidden onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input rounded-2xl" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom d&apos;utilisateur</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="input rounded-2xl" required />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="input resize-none rounded-2xl"
          />
          <p className="text-right text-xs text-muted">{bio.length}/160</p>
        </div>

        {message && <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-500"}`}>{message.text}</p>}

        <div className="flex justify-end">
          <button disabled={saving} className="btn-primary">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </form>
  );
}
