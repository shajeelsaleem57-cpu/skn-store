import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ensureUniqueCategorySlug, parseCategoryBody } from "../_helpers";

async function descendantIds(id: string): Promise<string[]> {
  const children = await prisma.category.findMany({ where: { parentId: id }, select: { id: true } });
  const ids: string[] = [];
  for (const c of children) {
    ids.push(c.id, ...(await descendantIds(c.id)));
  }
  return ids;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: { parent: { select: { id: true, name: true } }, _count: { select: { products: true, children: true } } },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  return NextResponse.json({ category });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const existing = await prisma.category.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = parseCategoryBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (parsed.data.parentId) {
    if (parsed.data.parentId === params.id) {
      return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 });
    }
    const desc = await descendantIds(params.id);
    if (desc.includes(parsed.data.parentId)) {
      return NextResponse.json({ error: "A category cannot be moved under one of its own children" }, { status: 400 });
    }
    const parent = await prisma.category.findUnique({ where: { id: parsed.data.parentId }, select: { id: true } });
    if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
  }

  const slug = await ensureUniqueCategorySlug(parsed.data.slug, params.id);
  const category = await prisma.category.update({ where: { id: params.id }, data: { ...parsed.data, slug } });
  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const existing = await prisma.category.findUnique({
    where: { id: params.id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  // Products' categoryId is set to null by the Prisma SetNull relation;
  // child categories are removed by the Cascade relation.
  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({
    ok: true,
    detachedProducts: existing._count.products,
    deletedChildren: existing._count.children,
  });
}
