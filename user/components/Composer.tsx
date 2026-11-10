"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Image from "next/image";
import { Earth, ImageIcon, Smile, Tag, Users, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";
import Avatar from "./Avatar";
import { CATEGORIES } from "@/lib/categories";

export default function Composer({ onCreated }: { onCreated: (post: Post) => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Autre");
  const [visibility, setVisibility] = useState<"public" | "followers">("public");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!user) {
    return (
      <div className="card flex items-center gap-4 p-4">
        <Avatar name="Invité" size={40} />
        <Link href="/login" className="input text-muted">
          Connecte-toi pour partager quelque chose…
        </Link>
      </div>
    );
  }

  if (user.role === "reader") {
    return (
      <div className="card flex items-center gap-4 p-4 text-sm text-muted">
        <Avatar src={user.avatar} name={user.name} size={40} />
        Ton compte est en mode lecteur : tu peux aimer, enregistrer et commenter les publications.
      </div>
    );
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setOpen(true);
  }

  function reset() {
    setTitle("");
    setContent("");
    setCategory("Autre");
    setFile(null);
    setPreview(null);
    setOpen(false);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);

    const form = new FormData();
    form.append("title", title);
    form.append("content", content);
    form.append("category", category);
    form.append("visibility", visibility);
    if (file) form.append("image", file);

    try {
      const { post } = await api<{ post: Post }>("/posts", { method: "POST", body: form });
      onCreated(post);
      reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-4">
      <div className="flex items-start gap-4">
        <Avatar src={user.avatar} name={user.name} size={40} />
        <div className="flex-1 space-y-3">
          {open && (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de ta publication"
              className="input rounded-2xl font-medium"
              maxLength={150}
            />
          )}
          <div className="relative">
            <textarea
              value={content}
              onFocus={() => setOpen(true)}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partage quelque chose… #hashtags bienvenus"
              rows={open ? 4 : 1}
              className="input resize-none rounded-[22px] pr-12"
            />
            <Smile className="absolute top-3 right-4 size-5 text-muted" />
          </div>
        </div>
      </div>

      {preview && (
        <div className="relative mt-4 ml-14 overflow-hidden rounded-2xl">
          <Image src={preview} alt="" width={800} height={500} unoptimized className="max-h-72 w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {error && <p className="mt-3 ml-14 text-sm text-red-500">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 pl-14 text-sm">
        <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 hover:text-brand">
          <ImageIcon className="size-5" /> Image
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />

        <label className="flex items-center gap-2">
          <Tag className="size-5" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="cursor-pointer bg-transparent outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="ml-auto flex items-center gap-2">
          {visibility === "public" ? <Earth className="size-5" /> : <Users className="size-5" />}
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "public" | "followers")}
            className="cursor-pointer bg-transparent outline-none"
          >
            <option value="public">Public</option>
            <option value="followers">Abonnés</option>
          </select>
        </label>

        {open && (
          <div className="flex w-full justify-end gap-2">
            <button type="button" onClick={reset} className="btn-ghost py-2">
              Annuler
            </button>
            <button disabled={sending || !title.trim() || !content.trim()} className="btn-primary py-2">
              {sending ? "Publication…" : "Publier"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
