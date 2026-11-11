"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

export default function CategoryChips() {
  const active = useSearchParams().get("category");

  const chip = (selected: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
      selected ? "bg-brand text-white" : "bg-white text-ink hover:bg-brand-soft hover:text-brand"
    }`;

  return (
    <nav aria-label="Catégories" className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 sm:-mx-4 sm:px-4 xl:hidden">
      <Link href="/" prefetch={false} className={chip(!active)}>
        Tout
      </Link>
      {CATEGORIES.map((name) => (
        <Link
          key={name}
          href={`/?category=${encodeURIComponent(name)}`}
          prefetch={false}
          className={chip(active === name)}
        >
          {name}
        </Link>
      ))}
    </nav>
  );
}
