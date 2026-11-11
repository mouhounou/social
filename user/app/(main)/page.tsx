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
    // Sur desktop, la page ne défile pas : seule la colonne du centre défile
    // (hauteur = écran − barre de navigation 73px − marge haute 24px).
    <div className="grid gap-6 lg:-mb-10 lg:h-[calc(100dvh-97px)] lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[280px_minmax(0,1fr)_280px]">
      {/* Le profil garde sa taille ; la carte des catégories prend la hauteur restante et défile à l'intérieur. */}
      <aside className="no-scrollbar hidden min-h-0 flex-col gap-6 overflow-y-auto pb-6 xl:flex">
        <div className="shrink-0">
          <ProfileCard />
        </div>
        <Suspense>
          <Shortcuts />
        </Suspense>
      </aside>

      <section className="no-scrollbar mx-auto w-full max-w-2xl min-w-0 space-y-4 lg:max-w-none lg:overflow-y-auto lg:pb-6">
        <Suspense>
          <CategoryChips />
        </Suspense>
        <Feed key={JSON.stringify(filters)} filters={filters} showComposer />
      </section>

      <aside className="no-scrollbar hidden overflow-y-auto pb-6 lg:block">
        <div className="space-y-6">
          <ActivityCard />
          <SuggestionsCard />
        </div>
      </aside>
    </div>
  );
}
