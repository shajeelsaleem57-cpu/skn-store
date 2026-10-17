import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export function parseProductBody(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  if (!title) return { error: "Title is required" } as const;

  let slug = String(body.slug ?? "").trim() || slugify(title);
  slug = slugify(slug);
  if (!slug) return { error: "Slug is required" } as const;

  const price = toInt(body.price, NaN);
  if (!Number.isFinite(price) || price < 0) return { error: "Price must be a non-negative number" } as const;
  const salePrice = toOptInt(body.salePrice);
  if (salePrice !== null && salePrice < 0) return { error: "Sale price must be non-negative" } as const;

  const images = Array.isArray(body.images)
    ? body.images.filter((x): x is string => typeof x === "string" && x.trim() !== "")
    : [];

  const specifications =
    body.specifications && typeof body.specifications === "object" && !Array.isArray(body.specifications)
      ? (body.specifications as Record<string, string>)
      : {};

  const variants = Array.isArray(body.variants)
    ? (body.variants as VariantInput[])
        .filter((v) => String(v.value ?? "").trim() !== "")
        .map((v) => ({
          name: String(v.name ?? "").trim() || "Option",
          value: String(v.value ?? "").trim(),
          priceAdjust: toInt(v.priceAdjust, 0),
          stock: toOptInt(v.stock),
          sku: String(v.sku ?? "").trim() || null,
        }))
    : [];

  const publishedAtRaw = String(body.publishedAt ?? "").trim();

  return {
    data: {
      title,
      slug,
      sku: String(body.sku ?? "").trim() || null,
      price,
      salePrice,
      stock: toInt(body.stock, 0),
      lowStockThreshold: toInt(body.lowStockThreshold, 5),
      images: JSON.stringify(images),
      shortDescription: String(body.shortDescription ?? "").trim() || null,
      description: String(body.description ?? "").trim() || null,
      specifications: JSON.stringify(specifications),
      categoryId: String(body.categoryId ?? "").trim() || null,
      isPublished: body.isPublished !== false,
      isFeatured: body.isFeatured === true,
      isBestSeller: body.isBestSeller === true,
      publishedAt: publishedAtRaw ? new Date(publishedAtRaw) : null,
      seoTitle: String(body.seoTitle ?? "").trim() || null,
      seoDescription: String(body.seoDescription ?? "").trim() || null,
      seoKeywords: String(body.seoKeywords ?? "").trim() || null,
    },
    variants,
  } as const;
}


export async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let i = 2;
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slug}-${i++}`;
  }
}


export type VariantInput = {
  name?: unknown;
  value?: unknown;
  priceAdjust?: unknown;
  stock?: unknown;
  sku?: unknown;
};


export function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? Math.trunc(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}


export function toOptInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = toInt(v, NaN);
  return Number.isFinite(n) ? n : null;
}
