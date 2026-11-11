import { Suspense } from "react";
import ActivityCard from "@/components/notification/ActivityCard";
import CategoryChips from "@/components/post/CategoryChips";
import Feed from "@/components/post/Feed";
import ProfileCard from "@/components/profile/ProfileCard";
import Shortcuts from "@/components/layout/Shortcuts";
import SuggestionsCard from "@/components/profile/SuggestionsCard";

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
