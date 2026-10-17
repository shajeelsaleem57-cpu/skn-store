import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePakistaniMobile } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const orderNumber = (req.nextUrl.searchParams.get("orderNumber") || "").trim();
  const mobile = (req.nextUrl.searchParams.get("mobile") || "").trim();

  if (!orderNumber || !mobile) {
    return NextResponse.json(
      { error: "Order number and mobile number are required." },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  // Do not reveal whether the order exists vs. the mobile mismatching.
  const normalizedInput = normalizePakistaniMobile(mobile);
  const normalizedStored = normalizePakistaniMobile(order?.mobile ?? "");
  if (!order || !normalizedInput || normalizedInput !== normalizedStored) {
    return NextResponse.json(
      {
        error:
          "We could not find an order with that order number and mobile number. Please check both and try again.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        title: i.title,
        variant: i.variant,
        price: i.price,
        qty: i.qty,
        image: i.image,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      courier: order.courier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      city: order.city,
      province: order.province,
    },
  });
}
