"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";

export default function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [category, setCategory] = useState(post?.category ?? "Autre");
  const [visibility, setVisibility] = useState(post?.visibility ?? "public");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(post?.image ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData();
    form.append("title", title);
    form.append("content", content);
    form.append("category", category);
    form.append("visibility", visibility);
    if (file) form.append("image", file);
    if (removeImage && !file) form.append("removeImage", "true");

    try {
      const res = await api<{ post: Post }>(post ? `/posts/${post._id}` : "/posts", {
        method: post ? "PATCH" : "POST",
        body: form,
      });
      router.push(`/posts/${res.post._id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      <h1 className="text-lg font-semibold">{post ? "Modifier la publication" : "Nouvelle publication"}</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Titre</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input rounded-2xl" maxLength={150} required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Contenu</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="input resize-y rounded-2xl"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Catégorie</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input rounded-2xl">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Visibilité</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Post["visibility"])}
            className="input rounded-2xl"
          >
            <option value="public">Public</option>
            <option value="followers">Abonnés uniquement</option>
          </select>
        </div>
      </div>

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl">
          <Image src={preview} alt="" width={800} height={500} unoptimized className="max-h-80 w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreview(null);
              setRemoveImage(true);
            }}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line py-10 text-sm text-muted hover:border-brand hover:text-brand"
        >
          <ImageIcon className="size-6" />
          Ajouter une image
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setFile(f);
          setPreview(URL.createObjectURL(f));
        }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Annuler
        </button>
        <button disabled={saving} className="btn-primary">
          {saving ? "Enregistrement…" : post ? "Enregistrer" : "Publier"}
        </button>
      </div>
    </form>
  );
}
