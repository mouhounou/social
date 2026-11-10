"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Bookmark, Compass, House, LogOut, Search, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Avatar from "./Avatar";
import Logo from "./Logo";

const links = [
  { href: "/", icon: House, label: "Accueil" },
  { href: "/explore", icon: Compass, label: "Explorer" },
  { href: "/saved", icon: Bookmark, label: "Enregistrés", auth: true },
  { href: "/notifications", icon: Bell, label: "Notifications", auth: true },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [unread, setUnread] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!user) return;
    api<{ unread: number }>("/notifications?limit=1")
      .then((d) => setUnread(d.unread))
      .catch(() => {});
  }, [user, pathname]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 lg:px-6">
        <Logo />

        <form onSubmit={onSearch} className="relative hidden w-full max-w-60 md:block">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher"
            className="input py-2.5 pl-11"
          />
        </form>

        <nav className="mx-auto flex items-center gap-1 sm:gap-3">
          {links
            .filter((l) => !l.auth || user)
            .map(({ href, icon: Icon, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`relative flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                    active ? "bg-brand-soft font-medium text-brand" : "text-muted hover:bg-field"
                  }`}
                >
                  <Icon className="size-5" />
                  {active && <span className="hidden sm:inline">{label}</span>}
                  {href === "/notifications" && unread > 0 && (
                    <span className="absolute top-1.5 right-2.5 size-2 rounded-full bg-red-500" />
                  )}
                </Link>
              );
            })}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="size-9 animate-pulse rounded-full bg-field" />
          ) : user ? (
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-3">
                <Avatar src={user.avatar} name={user.name} size={36} />
                <span className="hidden text-sm text-muted lg:inline">{user.name}</span>
              </button>
              {menu && (
                <div
                  onMouseLeave={() => setMenu(false)}
                  className="card absolute right-0 mt-3 w-52 overflow-hidden p-2 shadow-lg ring-1 ring-line"
                >
                  <Link
                    href={`/u/${user.username}`}
                    onClick={() => setMenu(false)}
                    className="block rounded-xl px-3 py-2 text-sm hover:bg-field"
                  >
                    Mon profil
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-field"
                  >
                    <Settings className="size-4" /> Paramètres
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                  >
                    <LogOut className="size-4" /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-brand">
                Connexion
              </Link>
              <Link href="/register" className="btn-primary hidden px-4 py-2 sm:inline-flex">
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
