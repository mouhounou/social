import { Suspense } from "react";
import ActivityCard from "@/components/ActivityCard";
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
    <div className="grid gap-6 lg:grid-cols-[260px_1fr_260px] xl:grid-cols-[280px_1fr_280px]">
      <aside className="hidden space-y-6 lg:block">
        <div className="sticky top-[96px] space-y-6">
          <ProfileCard />
          <Suspense>
            <Shortcuts />
          </Suspense>
        </div>
      </aside>

      <section className="min-w-0">
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
