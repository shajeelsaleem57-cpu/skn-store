import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export function parseCategoryBody(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  if (!name) return { error: "Name is required" } as const;
  let slug = slugify(String(body.slug ?? "").trim() || name);
  if (!slug) return { error: "Slug is required" } as const;
  return {
    data: {
      name,
      slug,
      description: String(body.description ?? "").trim() || null,
      image: String(body.image ?? "").trim() || null,
      icon: String(body.icon ?? "").trim() || null,
      parentId: String(body.parentId ?? "").trim() || null,
      sortOrder: toInt(body.sortOrder, 0),
      isVisible: body.isVisible !== false,
    },
  } as const;
}


export async function ensureUniqueCategorySlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let i = 2;
  for (;;) {
    const existing = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slug}-${i++}`;
  }
}


export function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? Math.trunc(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}
