import Link from "next/link";
import { IconChevronRight } from "./Icons";
import { cn } from "@/lib/utils";

function hrefFor(
  basePath: string,
  params: Record<string, string>,
  page: number
): string {
  const sp = new URLSearchParams(params);
  if (page <= 1) sp.delete("page");
  else sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const candidates = [1, 2, totalPages - 1, totalPages, page - 1, page, page + 1];
  const sorted: number[] = [];
  for (const p of candidates) {
    if (p >= 1 && p <= totalPages && sorted.indexOf(p) === -1) sorted.push(p);
  }
  sorted.sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="no-print flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={hrefFor(basePath, params, page - 1)}
          aria-label="Previous page"
          className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-2 text-sm text-ink hover:bg-soft-bg"
        >
          <IconChevronRight className="h-4 w-4 rotate-180" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-2 text-sm text-muted opacity-40"
        >
          <IconChevronRight className="h-4 w-4 rotate-180" />
        </span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(basePath, params, p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium",
              p === page
                ? "border-primary bg-primary text-white"
                : "border-border text-ink hover:bg-soft-bg"
            )}
          >
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link
          href={hrefFor(basePath, params, page + 1)}
          aria-label="Next page"
          className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-2 text-sm text-ink hover:bg-soft-bg"
        >
          <IconChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-2 text-sm text-muted opacity-40"
        >
          <IconChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
