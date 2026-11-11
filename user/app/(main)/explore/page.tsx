import type { Metadata } from "next";
import Link from "next/link";
import Feed from "@/components/post/Feed";
import { CATEGORIES } from "@/lib/constants";
import SuggestionsCard from "@/components/profile/SuggestionsCard";

export const metadata: Metadata = { title: "Explorer" };

export default function ExplorePage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_280px]">
      <section className="min-w-0 space-y-5">
        <div className="card p-5">
          <h1 className="text-lg font-semibold">Explorer</h1>
          <p className="text-sm text-muted">Les publications qui font parler en ce moment.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/?category=${encodeURIComponent(c)}`}
                prefetch={false}
                className="rounded-full bg-field px-4 py-1.5 text-xs font-medium hover:bg-brand-soft hover:text-brand"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
        <Feed filters={{ sort: "popular" }} showSort={false} />
      </section>
      <aside className="hidden lg:block">
        <SuggestionsCard />
      </aside>
    </div>
  );
}
