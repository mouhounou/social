"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { query } from "@/utils/query";
import type { Post, PostPage } from "@/types";
import Composer from "@/components/post/Composer";
import PostCard from "@/components/post/PostCard";
import Spinner from "@/components/ui/Spinner";

export type FeedFilters = {
  q?: string;
  category?: string;
  tag?: string;
  author?: string;
  saved?: string;
  sort?: string;
};

type Props = {
  filters?: FeedFilters;
  showComposer?: boolean;
  showSort?: boolean;
  empty?: string;
};

export default function Feed({ filters = {}, showComposer = false, showSort = true, empty }: Props) {
  const { loading: authLoading, user } = useAuth();
  const [sort, setSort] = useState(filters.sort ?? "recent");
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const key = JSON.stringify(filters);

  const fetchPage = useCallback(
    (p: number) => api<PostPage>(`/posts${query({ ...JSON.parse(key), sort, page: p })}`),
    [key, sort]
  );

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts);
        setPage(data.page);
        setPages(data.pages);
        setError("");
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [fetchPage, authLoading, user?._id]);

  async function loadMore() {
    setLoading(true);
    try {
      const data = await fetchPage(page + 1);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        return [...prev, ...data.posts.filter((p) => !seen.has(p._id))];
      });
      setPage(data.page);
      setPages(data.pages);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function changeSort(value: string) {
    setSort(value);
    setPosts([]);
    setLoading(true);
  }

  const activeFilter = filters.q
    ? `Résultats pour « ${filters.q} »`
    : filters.tag
      ? `#${filters.tag}`
      : filters.category;

  return (
    <div className="space-y-5">
      {showComposer && (
        <Composer onCreated={(post) => setPosts((prev) => [post, ...prev.filter((p) => p._id !== post._id)])} />
      )}

      {(showSort || activeFilter) && (
        <div className="flex items-center gap-4">
          {activeFilter ? (
            <Link href="/" className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium">
              {activeFilter} <X className="size-4 text-muted" />
            </Link>
          ) : (
            <div className="h-px flex-1 bg-line" />
          )}
          {showSort && (
            <label className="relative ml-auto flex items-center gap-1 text-xs text-muted">
              Trier par :
              <select
                value={sort}
                onChange={(e) => changeSort(e.target.value)}
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

      {posts.map((post) => (
        <PostCard key={post._id} post={post} onDeleted={(id) => setPosts((p) => p.filter((x) => x._id !== id))} />
      ))}

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {error && <p className="card p-6 text-center text-sm text-red-500">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="card p-10 text-center text-sm text-muted">{empty ?? "Aucune publication pour le moment."}</p>
      )}

      {!loading && page < pages && (
        <button onClick={loadMore} className="btn-ghost w-full bg-white">
          Voir plus
        </button>
      )}
    </div>
  );
}
