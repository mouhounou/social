"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { BookOpen, Camera, Cpu, Music, Palette, Plane, Shapes, Sparkles, Coffee } from "lucide-react";

const icons: Record<string, { icon: typeof Palette; tone: string }> = {
  "Art et dessin": { icon: Palette, tone: "bg-rose-100 text-rose-500" },
  Design: { icon: Sparkles, tone: "bg-violet-100 text-violet-500" },
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
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">Catégories</p>
        {active && (
          <Link href="/" className="text-xs text-muted hover:text-brand">
            Tout voir
          </Link>
        )}
      </div>
      <ul className="space-y-1">
        {CATEGORIES.map((name) => {
          const { icon: Icon, tone } = icons[name];
          return (
            <li key={name}>
              <Link
                href={`/?category=${encodeURIComponent(name)}`}
                prefetch={false}
                className={`flex items-center gap-3 rounded-xl p-2 text-sm font-medium transition hover:bg-field ${
                  active === name ? "bg-brand-soft text-brand" : ""
                }`}
              >
                <span className={`flex size-9 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="size-4" />
                </span>
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
