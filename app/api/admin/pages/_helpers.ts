import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export function parsePageBody(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  if (!title) return { error: "Title is required" } as const;
  let slug = slugify(String(body.slug ?? "").trim() || title);
  if (!slug) return { error: "Slug is required" } as const;
  return {
    data: {
      title,
      slug,
      content: String(body.content ?? ""),
      seoTitle: String(body.seoTitle ?? "").trim() || null,
      seoDescription: String(body.seoDescription ?? "").trim() || null,
      isPublished: body.isPublished !== false,
    },
  } as const;
}


export async function ensureUniquePageSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let i = 2;
  for (;;) {
    const existing = await prisma.page.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slug}-${i++}`;
  }
}
