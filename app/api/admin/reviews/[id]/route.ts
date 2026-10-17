import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const existing = await prisma.review.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const data: { isApproved?: boolean; isFeatured?: boolean } = {};
  if (body.isApproved !== undefined) data.isApproved = body.isApproved === true;
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured === true;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const review = await prisma.review.update({ where: { id: params.id }, data });

  // keep product rating aggregates in sync when approval changes
  if (data.isApproved !== undefined) {
    const agg = await prisma.review.aggregate({
      where: { productId: review.productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.product.update({
      where: { id: review.productId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
    });
  }

  return NextResponse.json({ review });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const existing = await prisma.review.findUnique({ where: { id: params.id }, select: { id: true, productId: true } });
  if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  await prisma.review.delete({ where: { id: params.id } });

  const agg = await prisma.review.aggregate({
    where: { productId: existing.productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: existing.productId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
  });

  return NextResponse.json({ ok: true });
}
