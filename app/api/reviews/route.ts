import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(2, "Please enter your name.").max(80),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10, "Please write a little more about the product.").max(2000),
});

/** POST /api/reviews — creates an UNAPPROVED review, then recalcs the product rating. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json(
      { error: first ? first.message : "Invalid review data." },
      { status: 400 }
    );
  }
  const { productId, name, rating, text } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isPublished) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Optional login: attach the user and mark verified if they actually bought it.
  let userId: string | null = null;
  let isVerified = false;
  try {
    const session = await getServerSession(authOptions);
    const sUser = session?.user as { id?: string } | undefined;
    if (sUser?.id) {
      userId = sUser.id;
      const bought = await prisma.order.findFirst({
        where: {
          userId,
          status: { not: "CANCELLED" },
          items: { some: { productId } },
        },
        select: { id: true },
      });
      isVerified = !!bought;
    }
  } catch {
    userId = null;
  }

  await prisma.review.create({
    data: {
      productId,
      userId,
      name: name.trim(),
      rating,
      text: text.trim(),
      isApproved: false,
      isVerified,
    },
  });

  // Recalculate the product's rating from approved reviews only.
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
