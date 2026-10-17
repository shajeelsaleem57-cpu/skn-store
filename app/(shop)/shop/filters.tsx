"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconX, IconFilter, IconChevronDown } from "@/components/Icons";

export type ShopCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

export type ShopFilterValues = {
  category: string;
  q: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
  inStock: boolean;
  sale: boolean;
};

function buildQuery(
  current: URLSearchParams,
  updates: Record<string, string | null>
): string {
  const params = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === "") params.delete(k);
    else params.set(k, v);
  }
  params.delete("page");
  const s = params.toString();
  return s ? `/shop?${s}` : "/shop";
}

function FilterFields({
  values,
  onChange,
  categories,
}: {
  values: ShopFilterValues;
  onChange: (v: ShopFilterValues) => void;
  categories: ShopCategory[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label htmlFor="f-category" className="mb-2 block text-sm font-semibold text-ink">
          Category
        </label>
        <select
          id="f-category"
          value={values.category}
          onChange={(e) => onChange({ ...values, category: e.target.value })}
          className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <optgroup key={c.id} label={c.name}>
              <option value={c.slug}>{c.name} — all</option>
              {c.children.map((ch) => (
                <option key={ch.id} value={ch.slug}>
                  {ch.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Price range (Rs.)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum price"
            value={values.minPrice}
            onChange={(e) => onChange({ ...values, minPrice: e.target.value })}
            className="w-full rounded border border-border px-3 py-2 text-sm text-ink"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum price"
            value={values.maxPrice}
            onChange={(e) => onChange({ ...values, maxPrice: e.target.value })}
            className="w-full rounded border border-border px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Rating</p>
        <div className="flex flex-col gap-1">
          {[
            { v: "", label: "Any rating" },
            { v: "4", label: "4 stars & up" },
            { v: "3", label: "3 stars & up" },
          ].map((o) => (
            <label key={o.v} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                name="rating"
                value={o.v}
                checked={values.rating === o.v}
                onChange={() => onChange({ ...values, rating: o.v })}
                className="accent-black"
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Availability</p>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={values.inStock}
              onChange={(e) => onChange({ ...values, inStock: e.target.checked })}
              className="accent-black"
            />
            In stock only
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={values.sale}
              onChange={(e) => onChange({ ...values, sale: e.target.checked })}
              className="accent-black"
            />
            On sale only
          </label>
        </div>
      </div>
    </div>
  );
}

/** Sidebar on desktop, slide-over drawer on mobile. */
export function FilterDrawer({
  categories,
  initial,
}: {
  categories: ShopCategory[];
  initial: ShopFilterValues;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ShopFilterValues>(initial);

  const apply = (v: ShopFilterValues) => {
    router.push(
      buildQuery(searchParams, {
        category: v.category || null,
        minPrice: v.minPrice || null,
        maxPrice: v.maxPrice || null,
        rating: v.rating || null,
        inStock: v.inStock ? "1" : null,
        sale: v.sale ? "1" : null,
      })
    );
    setOpen(false);
  };

  const clear = () => {
    const v: ShopFilterValues = {
      category: "",
      q: draft.q,
      minPrice: "",
      maxPrice: "",
      rating: "",
      inStock: false,
      sale: false,
    };
    setDraft(v);
    apply(v);
  };

  const activeCount =
    (draft.category ? 1 : 0) +
    (draft.minPrice || draft.maxPrice ? 1 : 0) +
    (draft.rating ? 1 : 0) +
    (draft.inStock ? 1 : 0) +
    (draft.sale ? 1 : 0);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 rounded border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Filters</h2>
            <button
              type="button"
              onClick={clear}
              className="text-xs font-medium text-muted hover:text-ink"
            >
              Clear all
            </button>
          </div>
          <FilterFields values={draft} onChange={setDraft} categories={categories} />
          <button
            type="button"
            onClick={() => apply(draft)}
            className="mt-6 w-full rounded bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Apply filters
          </button>
        </div>
      </aside>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded border border-border bg-white px-4 py-2 text-sm font-semibold text-ink lg:hidden"
      >
        <IconFilter />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 top-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="rounded p-1 text-muted hover:text-ink"
              >
                <IconX />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterFields values={draft} onChange={setDraft} categories={categories} />
            </div>
            <div className="flex gap-2 border-t border-border p-4">
              <button
                type="button"
                onClick={clear}
                className="flex-1 rounded border border-border px-4 py-2.5 text-sm font-semibold text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => apply(draft)}
                className="flex-1 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-white"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "best-selling", label: "Best Selling" },
  { value: "top-rated", label: "Top Rated" },
];

/** Sort select + grid/list view toggle toolbar. */
export function ShopToolbar({ total }: { total: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "featured";
  const view = searchParams.get("view") || "grid";

  const update = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    const s = params.toString();
    router.push(s ? `/shop?${s}` : "/shop");
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted">
        <span className="font-semibold text-ink">{total}</span>{" "}
        {total === 1 ? "product" : "products"}
      </p>
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
            className="appearance-none rounded border border-border bg-white py-2 pl-3 pr-8 text-sm text-ink"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted">
            <IconChevronDown />
          </span>
        </div>
        <div className="hidden overflow-hidden rounded border border-border sm:flex" role="group" aria-label="View">
          <button
            type="button"
            onClick={() => update("view", "grid")}
            aria-pressed={view === "grid"}
            className={`px-3 py-2 text-sm font-medium ${view === "grid" ? "bg-primary text-white" : "bg-white text-muted"}`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => update("view", "list")}
            aria-pressed={view === "list"}
            className={`px-3 py-2 text-sm font-medium ${view === "list" ? "bg-primary text-white" : "bg-white text-muted"}`}
          >
            List
          </button>
        </div>
      </div>
    </div>
  );
}
