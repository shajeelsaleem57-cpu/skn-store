import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

function parseTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
  return String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseBlogBody(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  if (!title) return { error: "Title is required" } as const;
  let slug = slugify(String(body.slug ?? "").trim() || title);
  if (!slug) return { error: "Slug is required" } as const;
  const publishedAtRaw = String(body.publishedAt ?? "").trim();
  return {
    data: {
      title,
      slug,
      excerpt: String(body.excerpt ?? "").trim() || null,
      content: String(body.content ?? ""),
      image: String(body.image ?? "").trim() || null,
      category: String(body.category ?? "").trim() || null,
      tags: JSON.stringify(parseTags(body.tags)),
      author: String(body.author ?? "").trim() || null,
      seoTitle: String(body.seoTitle ?? "").trim() || null,
      seoDescription: String(body.seoDescription ?? "").trim() || null,
      isPublished: body.isPublished !== false,
      publishedAt: publishedAtRaw ? new Date(publishedAtRaw) : null,
    },
  } as const;
}

export async function ensureUniqueBlogSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let i = 2;
  for (;;) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slug}-${i++}`;
  }
}
