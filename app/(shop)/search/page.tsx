import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { toCardData } from "../_helpers";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();

  const products = q
    ? await prisma.product.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q } },
            { shortDescription: { contains: q } },
            { description: { contains: q } },
          ],
        },
        orderBy: [{ isFeatured: "desc" }, { soldCount: "desc" }],
        take: 24,
      })
    : [];

  // Popular searches derived from live category names — no hard-coded terms.
  const popularCategories = q
    ? []
    : await prisma.category.findMany({
        where: { isVisible: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        take: 8,
        select: { name: true },
      });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <h1 className="mb-4 mt-2 text-2xl font-bold text-ink md:text-3xl">
        {q ? `Search results for "${q}"` : "Search products"}
      </h1>

      <div className="mb-8 max-w-xl">
        <SearchBar autoFocus />
      </div>

      {!q ? (
        <div>
          <h2 className="mb-3 text-base font-bold text-ink">Popular right now</h2>
          <div className="flex flex-wrap gap-2">
            {popularCategories.map((c) => (
              <Link
                key={c.name}
                href={`/search?q=${encodeURIComponent(c.name)}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition hover:border-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title={`No results for "${q}"`}
          description="Check your spelling, try a more general word, or browse the full shop."
          actionLabel="Browse all products"
          actionHref="/shop"
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            Found <span className="font-semibold text-ink">{products.length}</span>{" "}
            {products.length === 1 ? "product" : "products"}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={toCardData(p)} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
