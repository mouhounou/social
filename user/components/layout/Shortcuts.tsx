"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { BookOpen, Camera, ChevronRight, Coffee, Cpu, Music, Palette, PencilRuler, Plane, Shapes } from "lucide-react";

const icons: Record<string, { icon: typeof Palette; tone: string }> = {
  "Art et dessin": { icon: Palette, tone: "bg-rose-100 text-rose-500" },
  Design: { icon: PencilRuler, tone: "bg-violet-100 text-violet-500" },
  Photographie: { icon: Camera, tone: "bg-amber-100 text-amber-600" },
  Technologie: { icon: Cpu, tone: "bg-sky-100 text-sky-600" },
  Musique: { icon: Music, tone: "bg-emerald-100 text-emerald-600" },
  Voyage: { icon: Plane, tone: "bg-cyan-100 text-cyan-600" },
  Lifestyle: { icon: Coffee, tone: "bg-orange-100 text-orange-500" },
  Manga: { icon: BookOpen, tone: "bg-red-100 text-red-500" },
  Autre: { icon: Shapes, tone: "bg-gray-100 text-gray-500" },
};

export default function Shortcuts() {
  const active = useSearchParams().get("category");

  return (
    <div className="card flex min-h-52 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">Catégories</p>
        {active && (
          <Link href="/" className="rounded-full bg-field px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-brand-soft hover:text-brand">
            Tout voir
          </Link>
        )}
      </div>
      {/* La liste défile dans la carte quand la colonne manque de hauteur. */}
      <ul className="-mr-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-2 [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin]">
        {CATEGORIES.map((name) => {
          const { icon: Icon, tone } = icons[name];
          const isActive = active === name;
          return (
            <li key={name}>
              <Link
                href={isActive ? "/" : `/?category=${encodeURIComponent(name)}`}
                prefetch={false}
                aria-current={isActive ? "true" : undefined}
                className={`group flex items-center gap-3 rounded-2xl p-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  isActive ? "bg-brand-soft font-semibold text-brand" : "hover:bg-field"
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                    isActive ? "bg-brand text-white" : tone
                  }`}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <ChevronRight
                  className={`size-4 shrink-0 transition ${
                    isActive ? "text-brand" : "-translate-x-1 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
