import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const filter = sp.get("filter") || "pending";

  const where: Prisma.ReviewWhereInput = {};
  if (filter === "pending") where.isApproved = false;
  else if (filter === "approved") where.isApproved = true;
  else if (filter === "featured") where.isFeatured = true;

  const [total, pendingCount, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.findMany({
      where,
      orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { product: { select: { id: true, title: true } } },
    }),
  ]);

  return NextResponse.json({ reviews, total, page, totalPages: Math.ceil(total / PAGE_SIZE), pendingCount });
}
