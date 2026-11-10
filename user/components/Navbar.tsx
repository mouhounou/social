"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  CircleUser,
  Compass,
  House,
  LogIn,
  LogOut,
  Search,
  Settings,
  SquarePlus,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useOutsideClick } from "@/lib/useOutsideClick";
import Avatar from "./Avatar";
import Logo from "./Logo";

const links = [
  { href: "/", icon: House, label: "Accueil" },
  { href: "/explore", icon: Compass, label: "Explorer" },
  { href: "/saved", icon: Bookmark, label: "Enregistrés", auth: true },
  { href: "/notifications", icon: Bell, label: "Notifications", auth: true },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [menu, setMenu] = useState(false);
  const menuRef = useOutsideClick<HTMLDivElement>(menu, () => setMenu(false));

  useEffect(() => {
    if (!user) return;
    api<{ unread: number }>("/notifications?limit=1")
      .then((d) => setUnread(d.unread))
      .catch(() => {});
  }, [user, pathname]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    setSearchOpen(false);
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  const searchInput = (
    <>
      <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher"
        enterKeyHint="search"
        className="input py-2.5 pl-11"
      />
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-[72px] lg:px-6">
          <Logo />

          <form onSubmit={onSearch} className="relative hidden w-full max-w-60 md:block">
            {searchInput}
          </form>

          <nav className="mx-auto hidden items-center gap-2 md:flex lg:gap-3">
            {links
              .filter((l) => !l.auth || user)
              .map(({ href, icon: Icon, label }) => {
                const active = isActive(pathname, href);
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
                    {active && <span className="hidden lg:inline">{label}</span>}
                    {href === "/notifications" && unread > 0 && (
                      <span className="absolute top-1.5 right-2.5 size-2 rounded-full bg-red-500" />
                    )}
                  </Link>
                );
              })}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-3">
            <button
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Rechercher"
              className="rounded-full p-2 text-muted hover:bg-field md:hidden"
            >
              {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </button>

            {loading ? (
              <div className="size-9 animate-pulse rounded-full bg-field" />
            ) : user ? (
              <div ref={menuRef} className="relative">
                <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-3" aria-label="Mon compte">
                  <Avatar src={user.avatar} name={user.name} size={36} />
                  <span className="hidden text-sm text-muted lg:inline">{user.name}</span>
                </button>
                {menu && (
                  <div className="card absolute right-0 mt-3 w-52 overflow-hidden p-2 shadow-lg ring-1 ring-line">
                    <Link
                      href={`/u/${user.username}`}
                      onClick={() => setMenu(false)}
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-field"
                    >
                      Mon profil
                    </Link>
                    <Link
                      href="/saved"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-field md:hidden"
                    >
                      <Bookmark className="size-4" /> Enregistrés
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
                <Link href="/login" className="hidden text-sm font-medium text-brand sm:inline">
                  Connexion
                </Link>
                <Link href="/register" className="btn-primary px-4 py-2">
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={onSearch} className="relative border-t border-line px-4 py-3 md:hidden">
            <div className="relative">{searchInput}</div>
          </form>
        )}
      </header>

      <BottomNav unread={unread} />
    </>
  );
}

function BottomNav({ unread }: { unread: number }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const items = user
    ? [
        { href: "/", icon: House, label: "Accueil" },
        { href: "/explore", icon: Compass, label: "Explorer" },
        ...(user.role !== "reader" ? [{ href: "/posts/new", icon: SquarePlus, label: "Publier" }] : []),
        { href: "/notifications", icon: Bell, label: "Activité", badge: unread },
        { href: `/u/${user.username}`, icon: CircleUser, label: "Profil" },
      ]
    : [
        { href: "/", icon: House, label: "Accueil" },
        { href: "/explore", icon: Compass, label: "Explorer" },
        { href: "/login", icon: LogIn, label: "Connexion" },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex h-16 items-stretch justify-around">
        {items.map(({ href, icon: Icon, label, badge }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] ${
                  active ? "font-medium text-brand" : "text-muted"
                }`}
              >
                <Icon className="size-[22px]" />
                {label}
                {!!badge && <span className="absolute top-2.5 left-1/2 ml-2 size-2 rounded-full bg-red-500" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
