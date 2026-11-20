"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import NotificationRow from "@/components/notification/NotificationRow";
import SuggestionsCard from "@/components/profile/SuggestionsCard";
import Pagination from "@/components/ui/Pagination";
import { api } from "@/lib/api";
import { query } from "@/utils/query";
import { SECTION_LABELS, groupNotifications } from "@/utils/notifications";
import type { Notification, NotificationPage } from "@/types";

const PER_PAGE = 20;

type Filter = "all" | Notification["type"];

const FILTERS: { key: Filter; label: string; icon: typeof Bell; empty: string }[] = [
  { key: "all", label: "Tout", icon: Bell, empty: "Quand quelqu'un aimera, commentera ou commencera à te suivre, tu le verras ici." },
  { key: "like", label: "J'aime", icon: Heart, empty: "Personne n'a encore aimé tes publications." },
  {
    key: "comment",
    label: "Commentaires",
    icon: MessageCircle,
    empty: "Personne n'a encore commenté tes publications ni répondu à tes commentaires.",
  },
  { key: "follow", label: "Abonnés", icon: UserPlus, empty: "Personne ne t'a encore suivi." },
];

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<Layout header={null} tabs={null} body={<RowsSkeleton />} />}>
        <Notifications />
      </Suspense>
    </RequireAuth>
  );
}

function Layout({ header, tabs, body }: { header: React.ReactNode; tabs: React.ReactNode; body: React.ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <header>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="mt-1 h-5 text-sm text-muted">{header}</p>
        </header>
        {tabs}
        {body}
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-[97px] space-y-6">
          <SuggestionsCard />
        </div>
      </aside>
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="card p-2 sm:p-3">
      <ul aria-busy className="space-y-1">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 p-3">
            <span className="size-11 shrink-0 animate-pulse rounded-full bg-field" />
            <span className="flex-1 space-y-2">
              <span className="block h-3 w-2/3 animate-pulse rounded bg-field" />
              <span className="block h-2.5 w-1/4 animate-pulse rounded bg-field" />
            </span>
            <span className="size-12 animate-pulse rounded-xl bg-field" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Notifications() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Le filtre et la page sont dans l'adresse (?type=like&page=2) : le retour arrière y ramène.
  const filter: Filter = FILTERS.find((f) => f.key === params.get("type"))?.key ?? "all";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "", 10) || 1);

  const [unread, setUnread] = useState<number | null>(null);
  const [result, setResult] = useState<{ key: string; filter: Filter; data: NotificationPage } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  // Non lues à l'ouverture de la page : elles restent signalées pendant toute la visite.
  const [unreadIds, setUnreadIds] = useState<Set<string>>(() => new Set());
  const marked = useRef(false);
  const top = useRef<HTMLDivElement>(null);

  const requestKey = `${filter}|${page}|${attempt}`;

  const href = (changes: { type?: Filter; page?: number }) => {
    const next = new URLSearchParams(params);
    if ("type" in changes) {
      if (changes.type && changes.type !== "all") next.set("type", changes.type);
      else next.delete("type");
    }
    if (!changes.page || changes.page === 1) next.delete("page");
    else next.set("page", String(changes.page));
    const search = next.toString();
    return search ? `${pathname}?${search}` : pathname;
  };

  useEffect(() => {
    let cancelled = false;
    api<NotificationPage>(`/notifications${query({ type: filter === "all" ? undefined : filter, page, limit: PER_PAGE })}`)
      .then((d) => {
        if (cancelled) return;
        // Page au-delà de la dernière (lien ancien) : on revient à la dernière.
        if (!d.notifications.length && page > d.pages) {
          const next = new URLSearchParams(params);
          if (d.pages > 1) next.set("page", String(d.pages));
          else next.delete("page");
          router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
          return;
        }
        setResult({ key: requestKey, filter, data: d });
        setError("");
        // Au premier chargement : on retient ce qui était non lu, puis tout passe en lu
        // et la pastille de la barre de navigation s'éteint.
        if (!marked.current) {
          marked.current = true;
          setUnread(d.unread);
          setUnreadIds(new Set(d.notifications.filter((n) => !n.read).map((n) => n._id)));
          if (d.unread) {
            api("/notifications/read", { method: "PATCH" })
              .then(() => window.dispatchEvent(new Event("solola:notifications-read")))
              .catch(() => {});
          }
        }
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [filter, page, requestKey, router, pathname, params]);

  function scrollToTop() {
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Changement de page : on garde la liste affichée, estompée, le temps du chargement ; changement de filtre : squelette.
  const data = result?.filter === filter ? result.data : null;
  const loading = result?.key !== requestKey;
  const items = data ? data.notifications.map((n) => (unreadIds.has(n._id) ? { ...n, read: false } : n)) : null;
  const sections = items ? groupNotifications(items) : [];
  const current = FILTERS.find((f) => f.key === filter)!;

  const header =
    unread === null ? null : unread > 0 ? `${unread} nouvelle${unread > 1 ? "s" : ""} depuis ta dernière visite.` : "Tu es à jour.";

  const tabs = (
    <div role="tablist" aria-label="Filtrer les notifications" className="card grid grid-cols-4 gap-1 p-1.5">
      {FILTERS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          role="tab"
          aria-selected={filter === key}
          onClick={() => key !== filter && router.push(href({ type: key }), { scroll: false })}
          // Sur mobile, l'icône au-dessus du libellé : les quatre filtres tiennent sur la largeur.
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium whitespace-nowrap transition sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm ${
            filter === key ? "bg-brand-soft text-brand" : "text-muted hover:bg-field"
          }`}
        >
          <Icon className="size-4" /> {label}
        </button>
      ))}
    </div>
  );

  let body: React.ReactNode;
  if (error && !data) {
    body = (
      <div className="card flex flex-col items-center gap-3 py-12 text-center text-sm">
        <p className="text-red-500">{error}</p>
        <button onClick={() => setAttempt((n) => n + 1)} className="btn-ghost py-2">
          Réessayer
        </button>
      </div>
    );
  } else if (!items) {
    body = <RowsSkeleton />;
  } else if (items.length === 0) {
    body = (
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <current.icon className="size-6" />
        </span>
        <p className="font-medium">Rien pour l&apos;instant</p>
        <p className="max-w-xs text-sm text-muted">{current.empty}</p>
      </div>
    );
  } else {
    body = (
      <>
        <section
          role="tabpanel"
          aria-label={current.label}
          aria-busy={loading}
          className={`card p-2 transition-opacity sm:p-3 ${loading ? "opacity-50" : ""}`}
        >
          {sections.map(({ section, entries }) => (
            <div key={section}>
              <h2 className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
                {SECTION_LABELS[section]}
              </h2>
              <ul className="space-y-1">
                {entries.map((entry) => (
                  <NotificationRow key={entry.key} entry={entry} />
                ))}
              </ul>
            </div>
          ))}
          {error && <p className="px-3 pt-3 text-center text-sm text-red-500">{error}</p>}
        </section>
        <Pagination page={data!.page} pages={data!.pages} href={(n) => href({ page: n })} onNavigate={scrollToTop} />
      </>
    );
  }

  return (
    <div ref={top} className="scroll-mt-24">
      <Layout header={header} tabs={tabs} body={body} />
    </div>
  );
}
