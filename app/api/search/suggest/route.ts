import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q } },
          { shortDescription: { contains: q } },
        ],
      },
      orderBy: [{ soldCount: "desc" }],
      take: 6,
      select: { id: true, title: true, slug: true, price: true, salePrice: true, images: true },
    }),
    prisma.category.findMany({
      where: { isVisible: true, name: { contains: q } },
      orderBy: { sortOrder: "asc" },
      take: 4,
      select: { name: true, slug: true },
    }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      salePrice: p.salePrice,
      image: parseImages(p.images)[0] ?? null,
    })),
    categories,
  });
}
