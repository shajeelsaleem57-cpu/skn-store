"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconSearch, IconX } from "./Icons";
import { formatPKR } from "@/lib/utils";

/**
 * Suggestion API contract (implemented by /api/search/suggest):
 *   GET /api/search/suggest?q=... -> {
 *     products: [{ id, title, slug, image, price, salePrice }],
 *     categories: [{ name, slug }]
 *   }
 * Missing arrays are tolerated and render as empty.
 */
type SuggestProduct = {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  price: number;
  salePrice: number | null;
};

type SuggestCategory = { name: string; slug: string };

export default function SearchBar({
  autoFocus,
  onNavigate,
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<SuggestProduct[]>([]);
  const [categories, setCategories] = useState<SuggestCategory[]>([]);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setProducts([]);
      setCategories([]);
      setOpen(false);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(term)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setProducts(Array.isArray(data?.products) ? data.products : []);
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
        setOpen(true);
      } catch {
        /* suggestion fetch failed — user can still submit the form */
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDown = (e: globalThis.MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    go(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
    }
  };

  const showDropdown = open && q.trim().length >= 2;
  const hasResults = products.length > 0 || categories.length > 0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={submit} role="search">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (hasResults) setOpen(true);
          }}
          autoFocus={autoFocus}
          placeholder="Search products…"
          aria-label="Search products"
          autoComplete="off"
          className="w-full rounded-full border border-border bg-soft-bg py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted hover:text-ink"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {hasResults ? (
            <>
              {categories.length > 0 && (
                <div className="border-b border-border px-4 py-2">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.slice(0, 5).map((c) => (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() =>
                          go(`/shop?category=${encodeURIComponent(c.slug)}`)
                        }
                        className="rounded-full bg-soft-bg px-3 py-1 text-xs font-medium text-ink hover:bg-accent hover:text-white"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ul className="max-h-80 overflow-y-auto py-1">
                {products.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-soft-bg"
                    >
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-soft-bg">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-sm text-ink">
                          {p.title}
                        </span>
                        <span className="text-xs font-semibold text-sale">
                          {formatPKR(
                            p.salePrice != null && p.salePrice < p.price
                              ? p.salePrice
                              : p.price
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() =>
                  go(`/search?q=${encodeURIComponent(q.trim())}`)
                }
                className="block w-full border-t border-border bg-soft-bg px-4 py-2.5 text-center text-sm font-semibold text-primary hover:underline"
              >
                View all results for &ldquo;{q.trim()}&rdquo;
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)}
              className="block w-full px-4 py-3 text-center text-sm text-muted hover:bg-soft-bg"
            >
              No quick matches — press Enter to search for &ldquo;{q.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
