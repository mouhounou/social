"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Bookmark, CalendarDays, Camera, Grid3x3, Link2, LoaderCircle, MapPin, UserPen } from "lucide-react";
import Avatar from "@/components/Avatar";
import Feed from "@/components/Feed";
import FollowButton from "@/components/FollowButton";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import ConnectionsModal from "@/components/profile/ConnectionsModal";
import ProfileCompletion from "@/components/profile/ProfileCompletion";
import ProfileForm from "@/components/profile/ProfileForm";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { DEFAULT_COVER } from "@/lib/images";
import type { User } from "@/lib/types";

const roles = { reader: "Lecteur", author: "Auteur", admin: "Admin" };

export default function Profile({ username }: { username: string }) {
  const { user: me, loading, setUser: setMe } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [list, setList] = useState<"followers" | "following" | null>(null);
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [uploadError, setUploadError] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    api<{ user: User }>(`/users/${username}`)
      .then((d) => setUser(d.user))
      .catch((err) => setError(err.message));
  }, [username, loading, me?._id]);

  if (error) return <p className="card mx-auto max-w-3xl p-10 text-center text-sm text-muted">{error}</p>;
  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const isMe = !!user.isMe;

  function applyUpdate(updated: User) {
    setUser((u) => u && { ...u, ...updated, isMe: true });
  }

  async function quickUpload(field: "avatar" | "cover", file: File) {
    const previous = user![field];
    setUploadError("");
    setUploading(field);
    setUser((u) => u && { ...u, [field]: URL.createObjectURL(file) });

    const data = new FormData();
    data.append(field, file);
    try {
      const res = await api<{ user: User }>("/users/me", { method: "PATCH", body: data });
      applyUpdate(res.user);
      setMe(res.user);
    } catch (err) {
      setUser((u) => u && { ...u, [field]: previous });
      setUploadError((err as Error).message);
    } finally {
      setUploading(null);
    }
  }

  const joined = new Intl.DateTimeFormat("fr", { month: "long", year: "numeric" }).format(new Date(user.createdAt));
  const website = user.website?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="card overflow-hidden">
        <div className="relative h-36 bg-[#F3ECE3] sm:h-56 lg:h-64">
          <Image
            src={user.cover || DEFAULT_COVER}
            alt=""
            fill
            priority
            unoptimized={!user.cover || user.cover.startsWith("blob:")}
            className="object-cover"
            sizes="(min-width: 1152px) 1152px, 100vw"
          />
          {isMe && (
            <>
              <button
                onClick={() => coverInput.current?.click()}
                disabled={!!uploading}
                aria-label={user.cover ? "Changer la couverture" : "Ajouter une couverture"}
                className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-black/55 p-2.5 text-xs font-medium text-white backdrop-blur hover:bg-black/70 sm:top-4 sm:right-4 sm:px-4 sm:py-2"
              >
                {uploading === "cover" ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                <span className="hidden sm:inline">{user.cover ? "Changer la couverture" : "Ajouter une couverture"}</span>
              </button>
              <input
                ref={coverInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) quickUpload("cover", file);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>

        <div className="px-5 pb-6 sm:px-8">
          <div className="flex items-end justify-between gap-3">
            <div className="relative -mt-12 size-24 shrink-0 sm:-mt-16 sm:size-32">
              <Avatar src={user.avatar} name={user.name} size={128} fluid className="ring-4 ring-white sm:ring-[5px]" />
              {isMe && (
                <>
                  <button
                    onClick={() => avatarInput.current?.click()}
                    disabled={!!uploading}
                    aria-label="Changer la photo de profil"
                    className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-brand text-white ring-4 ring-white hover:bg-brand-dark sm:right-1 sm:bottom-1 sm:size-9"
                  >
                    {uploading === "avatar" ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  </button>
                  <input
                    ref={avatarInput}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) quickUpload("avatar", file);
                      e.target.value = "";
                    }}
                  />
                </>
              )}
            </div>

            <div className="flex gap-2 pb-1">
              {isMe ? (
                <button
                  onClick={() => setEditing(true)}
                  aria-label="Modifier le profil"
                  className="btn-ghost px-4 py-2.5 sm:px-5 sm:py-3"
                >
                  <UserPen className="size-4" />
                  <span>
                    Modifier<span className="hidden sm:inline"> le profil</span>
                  </span>
                </button>
              ) : (
                <FollowButton
                  variant="button"
                  userId={user._id}
                  initial={!!user.isFollowing}
                  onChange={(f) =>
                    setUser((u) => u && { ...u, isFollowing: f, followersCount: u.followersCount + (f ? 1 : -1) })
                  }
                />
              )}
            </div>
          </div>

          {uploadError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{uploadError}</p>}

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{user.name}</h1>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-medium text-brand">
                {roles[user.role]}
              </span>
            </div>
            <p className="text-sm text-muted">@{user.username}</p>
            {user.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed">{user.bio}</p>}
          </div>

          <div className="mt-6 grid max-w-md grid-cols-3 rounded-2xl border border-line py-3 text-center">
            <div>
              <p className="text-lg font-semibold">{user.postsCount ?? 0}</p>
              <p className="text-xs text-muted">Posts</p>
            </div>
            <button onClick={() => setList("followers")} className="hover:text-brand">
              <p className="text-lg font-semibold">{user.followersCount}</p>
              <p className="text-xs text-muted">Abonnés</p>
            </button>
            <button onClick={() => setList("following")} className="hover:text-brand">
              <p className="text-lg font-semibold">{user.followingCount}</p>
              <p className="text-xs text-muted">Abonnements</p>
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-6">
          <div className="card space-y-4 p-5 lg:sticky lg:top-[96px]">
            <p className="font-semibold">À propos</p>
            <ul className="space-y-3 text-sm">
              {user.location && (
                <li className="flex items-center gap-3">
                  <MapPin className="size-4 shrink-0 text-muted" /> {user.location}
                </li>
              )}
              {user.website && (
                <li className="flex items-center gap-3">
                  <Link2 className="size-4 shrink-0 text-muted" />
                  <a href={user.website} target="_blank" rel="noopener noreferrer nofollow" className="truncate text-brand hover:underline">
                    {website}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-3">
                <CalendarDays className="size-4 shrink-0 text-muted" /> Membre depuis {joined}
              </li>
            </ul>
            {!user.bio && !user.location && !user.website && !isMe && (
              <p className="text-xs text-muted">{user.name} n&apos;a pas encore rempli son profil.</p>
            )}
          </div>

          {isMe && <ProfileCompletion user={user} onEdit={() => setEditing(true)} />}
        </aside>

        <section className="min-w-0 space-y-5">
          {isMe && (
            <div className="card flex gap-1 p-1.5">
              {[
                { key: "posts" as const, label: "Mes publications", icon: Grid3x3 },
                { key: "saved" as const, label: "Enregistrés", icon: Bookmark },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-medium transition ${
                    tab === key ? "bg-brand-soft text-brand" : "text-muted hover:bg-field"
                  }`}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
          )}

          {tab === "posts" ? (
            <Feed
              key="posts"
              filters={{ author: user.username }}
              showComposer={isMe}
              empty={isMe ? "Tu n'as encore rien publié." : "Aucune publication pour le moment."}
            />
          ) : (
            <Feed key="saved" filters={{ saved: "true" }} showSort={false} empty="Tu n'as encore rien enregistré." />
          )}
        </section>
      </div>

      {editing && (
        <Modal title="Modifier le profil" onClose={() => setEditing(false)} width="max-w-2xl">
          <ProfileForm
            user={user}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => {
              setEditing(false);
              if (updated.username !== user.username) {
                window.history.replaceState(null, "", `/u/${updated.username}`);
              }
              applyUpdate(updated);
            }}
          />
        </Modal>
      )}

      {list && <ConnectionsModal username={user.username} type={list} onClose={() => setList(null)} />}
    </div>
  );
}
