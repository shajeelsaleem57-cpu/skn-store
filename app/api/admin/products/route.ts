import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { parseProductBody, ensureUniqueSlug } from "./_helpers";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const q = sp.get("q")?.trim() || "";
  const categoryId = sp.get("category") || "";
  const status = sp.get("status") || "";

  const where: Prisma.ProductWhereInput = {};
  if (q) where.OR = [{ title: { contains: q } }, { sku: { contains: q } }];
  if (categoryId) where.categoryId = categoryId;
  if (status === "published") where.isPublished = true;
  if (status === "draft") where.isPublished = false;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / PAGE_SIZE) });
}

/** Normalize + validate the product payload shared by POST and PUT. */

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = parseProductBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (parsed.data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } });
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  const slug = await ensureUniqueSlug(parsed.data.slug);
  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      slug,
      variants: { create: parsed.variants },
    },
  });
  return NextResponse.json({ product }, { status: 201 });
}
