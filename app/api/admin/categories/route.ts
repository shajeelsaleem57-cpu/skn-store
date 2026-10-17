import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { parseCategoryBody, ensureUniqueCategorySlug } from "./_helpers";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = parseCategoryBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (parsed.data.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parsed.data.parentId }, select: { id: true } });
    if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
  }

  const slug = await ensureUniqueCategorySlug(parsed.data.slug);
  const category = await prisma.category.create({ data: { ...parsed.data, slug } });
  return NextResponse.json({ category }, { status: 201 });
}
