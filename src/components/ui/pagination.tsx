import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pages(current: number, total: number) {
  const set = new Set([1, total, current, current - 1, current + 1]);
  const list = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null;
  const item = "inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] px-3 text-sm font-semibold";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "hover:bg-surface-2")} rel="prev">
          <ChevronLeft className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
        </Link>
      ) : (
        <span className={cn(item, "text-muted/50")} aria-disabled>
          <ChevronLeft className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
        </span>
      )}
      {pages(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className={cn(item, "text-muted")}>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-ink text-ink-contrast" : "hover:bg-surface-2", "hidden sm:inline-flex", p === page && "inline-flex")}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(item, "hover:bg-surface-2")} rel="next">
          <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(item, "text-muted/50")} aria-disabled>
          <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
