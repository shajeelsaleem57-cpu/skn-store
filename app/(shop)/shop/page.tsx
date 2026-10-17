import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { parseImages } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import Rating from "@/components/Rating";
import Price from "@/components/Price";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { toCardData } from "../_helpers";
import { FilterDrawer, ShopToolbar, type ShopFilterValues } from "./filters";

export const metadata: Metadata = {
  title: "Shop All Products Online in Pakistan",
  description:
    "Browse 200+ quality products online in Pakistan — mobile accessories, kitchen gadgets, household essentials & beauty products. Cash on Delivery, 2-4 day delivery nationwide.",
  keywords: [
    "online shopping Pakistan",
    "buy online Pakistan",
    "cash on delivery Pakistan",
    "mobile accessories Pakistan",
    "kitchen gadgets Pakistan",
  ],
  openGraph: {
    title: "Shop All Products Online in Pakistan | SKN Store",
    description:
      "200+ quality products with Cash on Delivery across Pakistan. Mobile accessories, kitchen gadgets, household & beauty essentials.",
    type: "website",
  },
};

// Note: shop uses searchParams (filters/sort), so it stays dynamic —
// a `revalidate` export would have no effect here.

const PAGE_SIZE = 12;

type SearchParams = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function orderByFor(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "best-selling":
      return [{ soldCount: "desc" }];
    case "top-rated":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "featured":
    default:
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
  }
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const q = first(searchParams.q)?.trim() || "";
  const categorySlug = first(searchParams.category) || "";
  const minPrice = Number(first(searchParams.minPrice)) || 0;
  const maxPrice = Number(first(searchParams.maxPrice)) || 0;
  const rating = Number(first(searchParams.rating)) || 0;
  const inStock = first(searchParams.inStock) === "1";
  const sale = first(searchParams.sale) === "1" || first(searchParams.filter) === "sale";
  const bestSellers = first(searchParams.filter) === "best-sellers";
  const sort = first(searchParams.sort) || "featured";
  const view = first(searchParams.view) === "list" ? "list" : "grid";
  const page = Math.max(1, Number(first(searchParams.page)) || 1);

  const where: Prisma.ProductWhereInput = { isPublished: true };

  let activeCategory: { id: string; name: string; slug: string } | null = null;
  if (categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: { children: { select: { id: true } } },
    });
    if (cat) {
      activeCategory = { id: cat.id, name: cat.name, slug: cat.slug };
      where.categoryId = { in: [cat.id, ...cat.children.map((c) => c.id)] };
    }
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { shortDescription: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (minPrice > 0) where.price = { ...(typeof where.price === "object" ? where.price : {}), gte: minPrice };
  if (maxPrice > 0) where.price = { ...(typeof where.price === "object" ? where.price : {}), lte: maxPrice };
  if (rating >= 1 && rating <= 5) where.ratingAvg = { gte: rating };
  if (inStock) where.stock = { gt: 0 };
  if (sale) where.salePrice = { not: null };
  if (bestSellers) where.isBestSeller = true;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: orderByFor(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      // Select only fields needed for cards - speeds up query significantly
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        salePrice: true,
        stock: true,
        images: true,
        shortDescription: true,
        ratingAvg: true,
        ratingCount: true,
        isBestSeller: true,
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const categories = await prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });

  const initial: ShopFilterValues = {
    category: categorySlug,
    q,
    minPrice: first(searchParams.minPrice) || "",
    maxPrice: first(searchParams.maxPrice) || "",
    rating: first(searchParams.rating) || "",
    inStock,
    sale,
  };

  // Preserve all params except page for the pagination links.
  const paginationParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === "page") continue;
    const val = first(v);
    if (val) paginationParams[k] = val;
  }

  const crumbs = [{ label: "Home", href: "/" }, { label: "Shop" }];
  if (activeCategory) crumbs.push({ label: activeCategory.name });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={crumbs} />
      <div className="mb-6 mt-2 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">
          {activeCategory ? activeCategory.name : q ? `Results for "${q}"` : "Shop All Products"}
        </h1>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <FilterDrawer categories={categories} initial={initial} />
        <div className="min-w-0 flex-1">
          <div className="mb-4">
            <ShopToolbar total={total} />
          </div>

          {products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search terms to find what you are looking for."
              actionLabel="Clear filters"
              actionHref="/shop"
            />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={toCardData(p)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {products.map((p) => {
                const images = parseImages(p.images);
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    className="flex gap-4 rounded border border-border bg-card p-4 transition hover:shadow-md"
                  >
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded bg-soft-bg sm:h-36 sm:w-36">
                      {images[0] ? (
                        <Image
                          src={images[0]}
                          alt={p.title}
                          fill
                          className="object-cover"
                          sizes="144px"
                        />
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <h2 className="truncate text-base font-semibold text-ink">{p.title}</h2>
                      <Rating value={p.ratingAvg} count={p.ratingCount} size={14} />
                      {p.shortDescription ? (
                        <p className="line-clamp-2 text-sm text-muted">{p.shortDescription}</p>
                      ) : null}
                      <Price price={p.price} salePrice={p.salePrice} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} basePath="/shop" params={paginationParams} />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
