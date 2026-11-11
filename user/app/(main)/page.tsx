import { Suspense } from "react";
import ActivityCard from "@/components/ActivityCard";
import CategoryChips from "@/components/CategoryChips";
import Feed from "@/components/Feed";
import ProfileCard from "@/components/ProfileCard";
import Shortcuts from "@/components/Shortcuts";
import SuggestionsCard from "@/components/SuggestionsCard";

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const filters = {
    q: pick(params.q),
    category: pick(params.category),
    tag: pick(params.tag),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[280px_minmax(0,1fr)_280px]">
      <aside className="hidden space-y-6 xl:block">
        <div className="sticky top-[96px] space-y-6">
          <ProfileCard />
          <Suspense>
            <Shortcuts />
          </Suspense>
        </div>
      </aside>

      <section className="mx-auto w-full max-w-2xl min-w-0 space-y-4 lg:max-w-none">
        <Suspense>
          <CategoryChips />
        </Suspense>
        <Feed key={JSON.stringify(filters)} filters={filters} showComposer />
      </section>

      <aside className="hidden space-y-6 lg:block">
        <div className="sticky top-[96px] space-y-6">
          <ActivityCard />
          <SuggestionsCard />
        </div>
      </aside>
    </div>
  );
}
