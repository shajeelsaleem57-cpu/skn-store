import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/admin";

/** GET /api/account/orders — the logged-in user's own orders. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const orders = await prisma.order.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: { id: true, title: true, variant: true, price: true, qty: true, image: true },
      },
    },
  });

  return NextResponse.json({ orders });
}
