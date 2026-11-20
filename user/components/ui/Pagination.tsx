import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Numéros affichés : la première et la dernière page, la page courante et ses voisines, « … » entre les trous. */
export function pageItems(page: number, pages: number): (number | "…")[] {
  const shown = [...new Set([1, page - 1, page, page + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const items: (number | "…")[] = [];
  let previous = 0;
  for (const p of shown) {
    if (p - previous === 2) items.push(previous + 1);
    else if (p - previous > 2) items.push("…");
    items.push(p);
    previous = p;
  }
  return items;
}

type Props = {
  page: number;
  pages: number;
  href: (page: number) => string;
  onNavigate?: () => void;
};

export default function Pagination({ page, pages, href, onNavigate }: Props) {
  if (pages <= 1) return null;

  const base = "flex size-10 items-center justify-center rounded-full text-sm font-medium transition";
  const arrow = (target: number, label: string, Icon: typeof ChevronLeft) =>
    target < 1 || target > pages ? (
      <span aria-hidden className={`${base} text-muted/40`}>
        <Icon className="size-5" />
      </span>
    ) : (
      <Link href={href(target)} scroll={false} onClick={onNavigate} aria-label={label} className={`${base} hover:bg-white`}>
        <Icon className="size-5" />
      </Link>
    );

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {arrow(page - 1, "Page précédente", ChevronLeft)}
      {pageItems(page, pages).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="w-6 text-center text-sm text-muted">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            scroll={false}
            onClick={onNavigate}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={`${base} ${item === page ? "bg-ink text-white" : "hover:bg-white"}`}
          >
            {item}
          </Link>
        )
      )}
      {arrow(page + 1, "Page suivante", ChevronRight)}
    </nav>
  );
}
