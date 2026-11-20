"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Post } from "@/types";
import { CATEGORIES } from "@/lib/constants";
import { clearDraft, peekDraft } from "@/lib/draft";
import { MAX_TAGS, extraTags, postText } from "@/lib/tags";
import TagInput from "@/components/post/TagInput";
import ParagraphsEditor, { newParagraph, serializeParagraphs } from "@/components/post/ParagraphsEditor";

export default function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  // Publication commencée dans le formulaire rapide du fil.
  const [draft] = useState(() => (post ? null : peekDraft()));
  const [title, setTitle] = useState(post?.title ?? draft?.title ?? "");
  const [content, setContent] = useState(post?.content ?? draft?.content ?? "");
  const [category, setCategory] = useState(post?.category ?? draft?.category ?? "Autre");
  const [visibility, setVisibility] = useState(post?.visibility ?? draft?.visibility ?? "public");
  const [tags, setTags] = useState(() =>
    post ? extraTags(post.tags, postText(post)).slice(0, MAX_TAGS) : (draft?.tags ?? [])
  );
  const [paragraphs, setParagraphs] = useState(() => (post?.paragraphs ?? []).map(newParagraph));
  const [file, setFile] = useState<File | null>(draft?.file ?? null);
  const [preview, setPreview] = useState<string | null>(post?.image ?? draft?.preview ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const [invalidParagraph, setInvalidParagraph] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!post) clearDraft();
  }, [post]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setInvalidParagraph(null);

    const { paragraphs: list, files } = serializeParagraphs(paragraphs);
    const form = new FormData();
    form.append("title", title);
    form.append("content", content);
    form.append("category", category);
    form.append("tags", tags.join(","));
    form.append("visibility", visibility);
    form.append("paragraphs", JSON.stringify(list));
    if (file) form.append("image", file);
    if (removeImage && !file) form.append("removeImage", "true");
    for (const f of files) form.append("media", f);
    const uploading = !!file || files.length > 0;

    try {
      const res = await api<{ post: Post }>(post ? `/posts/${post._id}` : "/posts", {
        method: post ? "PATCH" : "POST",
        body: form,
        onUploadProgress: uploading ? setProgress : undefined,
      });
      router.push(`/posts/${res.post._id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
      setProgress(null);
      // « paragraphs.2.media » : on montre le paragraphe en cause.
      const index = err instanceof ApiError ? err.field?.match(/^paragraphs\.(\d+)/)?.[1] : undefined;
      if (index !== undefined) {
        setInvalidParagraph(Number(index));
        document.getElementById(`paragraphe-${index}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
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
            aria-label="Retirer l'image de couverture"
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
          Ajouter une image de couverture
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setFile(f);
          setPreview(URL.createObjectURL(f));
        }}
      />

      <ParagraphsEditor value={paragraphs} onChange={setParagraphs} invalid={invalidParagraph} />

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

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <TagInput value={tags} onChange={setTags} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Annuler
        </button>
        <button disabled={saving} className="btn-primary">
          {progress !== null && progress < 100
            ? `Envoi… ${progress} %`
            : saving
              ? "Enregistrement…"
              : post
                ? "Enregistrer"
                : "Publier"}
        </button>
      </div>
    </form>
  );
}
