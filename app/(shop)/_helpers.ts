import type { Product } from "@prisma/client";
import { parseImages } from "@/lib/utils";
import type { ProductCardData } from "@/components/ProductCard";

type CardSource = Pick<
  Product,
  "id" | "title" | "slug" | "price" | "salePrice" | "images" | "ratingAvg" | "ratingCount" | "stock"
>;

/** Convert a Prisma product row into the shape the shared ProductCard expects. */
export function toCardData(p: CardSource): ProductCardData {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    price: p.price,
    salePrice: p.salePrice,
    images: parseImages(p.images),
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    stock: p.stock,
  };
}

/** Parse a JSON config blob, merging over a typed fallback on failure. */
export function parseConfig<T extends Record<string, unknown>>(
  raw: string | null | undefined,
  fallback: T
): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return { ...fallback, ...parsed };
    return fallback;
  } catch {
    return fallback;
  }
}
