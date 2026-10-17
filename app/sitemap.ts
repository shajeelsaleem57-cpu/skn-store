import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "/",
  "/shop",
  "/categories",
  "/track-order",
  "/contact",
  "/faq",
  "/blog",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://skn-store.vercel.app"
  ).replace(/\/$/, "");

  const [products, categories, pages, posts] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isVisible: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, publishedAt: true, createdAt: true },
    }),
  ]);

  const now = new Date();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${base}${route}`,
      lastModified: now,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...categories.map((c) => ({
      url: `${base}/shop?category=${encodeURIComponent(c.slug)}`,
      lastModified: c.updatedAt,
    })),
    ...pages.map((p) => ({
      url: `${base}/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.publishedAt ?? p.createdAt,
    })),
  ];
}
