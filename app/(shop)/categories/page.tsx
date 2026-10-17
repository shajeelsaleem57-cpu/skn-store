import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { IconChevronRight } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Shop by Category | Mobile, Kitchen, Beauty & More",
  description:
    "Explore product categories at SKN Store Pakistan — Mobile Accessories, Kitchen Appliances, Home & Living, Beauty & Personal Care. Cash on Delivery nationwide.",
  keywords: [
    "product categories Pakistan",
    "mobile accessories Pakistan",
    "kitchen appliances Pakistan",
    "beauty products Pakistan",
    "home essentials Pakistan",
  ],
  openGraph: {
    title: "Shop by Category | SKN Store Pakistan",
    description:
      "Mobile Accessories, Kitchen Appliances, Home & Living, Beauty — shop by category with Cash on Delivery across Pakistan.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const parents = await prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { products: true } },
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink md:text-3xl">Shop by Category</h1>

      {parents.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Check back soon — we are adding new categories."
          actionLabel="Browse all products"
          actionHref="/shop"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {parents.map((c) => (
            <div
              key={c.id}
              className="overflow-hidden rounded border border-border bg-card transition hover:shadow-md"
            >
              <Link href={`/shop?category=${c.slug}`} className="group block">
                <div className="relative aspect-[16/9] w-full bg-soft-bg">
                  {c.image ? (
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : null}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-ink group-hover:underline">{c.name}</h2>
                    <IconChevronRight />
                  </div>
                  {c.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>
                  ) : null}
                </div>
              </Link>
              {c.children.length > 0 ? (
                <div className="flex flex-wrap gap-2 border-t border-border p-4">
                  {c.children.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/shop?category=${ch.slug}`}
                      className="rounded-full bg-soft-bg px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-primary hover:text-white"
                    >
                      {ch.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
