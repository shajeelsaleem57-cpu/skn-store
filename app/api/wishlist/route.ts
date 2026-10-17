import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/admin";
import { parseImages } from "@/lib/utils";

const toggleSchema = z.object({ productId: z.string().min(1) });

/** GET /api/wishlist — the logged-in user's wishlist products. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const rows = await prisma.wishlist.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });

  return NextResponse.json({
    products: rows
      .filter((r) => r.product.isPublished)
      .map((r) => ({
        id: r.product.id,
        title: r.product.title,
        slug: r.product.slug,
        price: r.product.price,
        salePrice: r.product.salePrice,
        images: parseImages(r.product.images),
        ratingAvg: r.product.ratingAvg,
        ratingCount: r.product.ratingCount,
        stock: r.product.stock,
      })),
  });
}

/** POST /api/wishlist {productId} — toggle: adds if missing, removes if present. */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }
  const { productId } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isPublished) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: auth.user.id, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return NextResponse.json({ added: false });
  }

  await prisma.wishlist.create({ data: { userId: auth.user.id, productId } });
  return NextResponse.json({ added: true });
}

/** DELETE /api/wishlist?productId= — remove one item. */
export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  await prisma.wishlist.deleteMany({
    where: { userId: auth.user.id, productId },
  });
  return NextResponse.json({ ok: true });
}
