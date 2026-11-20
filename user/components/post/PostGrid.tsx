"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { query } from "@/utils/query";
import type { PostPage } from "@/types";
import type { FeedFilters } from "@/components/post/Feed";
import Composer from "@/components/post/Composer";
import PostTile from "@/components/post/PostTile";
import Pagination from "@/components/ui/Pagination";

export const PER_PAGE = 6;

type Props = {
  filters: FeedFilters;
  empty: string;
  showAuthor?: boolean;
  showSort?: boolean;
  showComposer?: boolean;
};

/** Publications en grille (3 colonnes quand la place le permet), 6 par page. La page est dans l'adresse (?page=2). */
export default function PostGrid(props: Props) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Grid {...props} />
    </Suspense>
  );
}

function withParams(pathname: string, params: URLSearchParams, changes: Record<string, string | number | undefined>) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || (key === "page" && value === 1)) next.delete(key);
    else next.set(key, String(value));
  }
  const search = next.toString();
  return search ? `${pathname}?${search}` : pathname;
}

function Grid({ filters, empty, showAuthor = true, showSort = false, showComposer = false }: Props) {
  const { loading: authLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "", 10) || 1);
  const sort = showSort && params.get("sort") === "popular" ? "popular" : "recent";
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ key: string; data: PostPage } | null>(null);
  const [error, setError] = useState("");
  const top = useRef<HTMLDivElement>(null);

  const filterKey = JSON.stringify(filters);
  const requestKey = `${filterKey}|${sort}|${page}|${version}|${user?._id ?? ""}`;
  const loading = result?.key !== requestKey;
  const data = result?.data;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    api<PostPage>(`/posts${query({ ...JSON.parse(filterKey), sort, page, limit: PER_PAGE })}`)
      .then((d) => {
        if (cancelled) return;
        // Page au-delà de la dernière (lien ancien, ou dernier élément retiré) : on revient à la dernière.
        if (!d.posts.length && page > d.pages) {
          router.replace(withParams(pathname, params, { page: d.pages }), { scroll: false });
          return;
        }
        setResult({ key: requestKey, data: d });
        setError("");
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [authLoading, filterKey, sort, page, requestKey, router, pathname, params]);

  const href = (changes: Record<string, string | number | undefined>) => withParams(pathname, params, changes);

  function scrollToTop() {
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reload() {
    setVersion((v) => v + 1);
  }

  return (
    <div ref={top} className="scroll-mt-24 space-y-5">
      {showComposer && (
        <Composer onCreated={() => (page === 1 ? reload() : router.push(href({ page: undefined }), { scroll: false }))} />
      )}

      {(showSort || (data && data.total > 0)) && (
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted">
            {data ? `${data.total} publication${data.total > 1 ? "s" : ""}` : " "}
          </p>
          {showSort && (
            <label className="relative ml-auto flex items-center gap-1 text-xs text-muted">
              Trier par :
              <select
                value={sort}
                onChange={(e) =>
                  router.push(href({ sort: e.target.value === "popular" ? "popular" : undefined, page: undefined }), {
                    scroll: false,
                  })
                }
                className="cursor-pointer appearance-none bg-transparent pr-5 font-medium text-ink outline-none"
              >
                <option value="recent">Récent</option>
                <option value="popular">Populaire</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 size-4" />
            </label>
          )}
        </div>
      )}

      {error ? (
        <div className="card space-y-4 p-6 text-center text-sm">
          <p className="text-red-500">{error}</p>
          <button onClick={reload} className="btn-ghost">
            Réessayer
          </button>
        </div>
      ) : !data ? (
        <Skeleton />
      ) : data.posts.length === 0 ? (
        <p className="card p-10 text-center text-sm text-muted">{empty}</p>
      ) : (
        <>
          <div className="@container">
            <div
              aria-busy={loading}
              className={`grid grid-cols-1 gap-5 transition-opacity @md:grid-cols-2 @3xl:grid-cols-3 ${loading ? "opacity-50" : ""}`}
            >
              {data.posts.map((post) => (
                <PostTile
                  key={post._id}
                  post={post}
                  showAuthor={showAuthor}
                  // Dans « Enregistrés », une publication retirée quitte la grille : la page se recharge.
                  onSavedChange={filters.saved === "true" ? (saved) => !saved && reload() : undefined}
                />
              ))}
            </div>
          </div>
          <Pagination page={data.page} pages={data.pages} href={(n) => href({ page: n })} onNavigate={scrollToTop} />
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-5 @md:grid-cols-2 @3xl:grid-cols-3">
        {Array.from({ length: PER_PAGE }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[4/3] animate-pulse bg-field" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-field" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-field" />
              <div className="h-3 w-full animate-pulse rounded bg-field" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
