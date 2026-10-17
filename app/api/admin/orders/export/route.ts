import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { buildOrderWhere } from "../_helpers";

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const where = buildOrderWhere(req.nextUrl.searchParams);
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { items: { select: { title: true, variant: true, qty: true, price: true } } },
  });

  const header = [
    "Order Number",
    "Date",
    "Status",
    "Name",
    "Mobile",
    "City",
    "Province",
    "Items",
    "Subtotal",
    "Delivery Fee",
    "Discount",
    "Total",
    "Coupon",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const o of orders) {
    const items = o.items.map((i) => `${i.title}${i.variant ? ` (${i.variant})` : ""} x${i.qty}`).join("; ");
    lines.push(
      [
        o.orderNumber,
        o.createdAt.toISOString(),
        o.status,
        o.fullName,
        o.mobile,
        o.city,
        o.province,
        items,
        o.subtotal,
        o.deliveryFee,
        o.discount,
        o.total,
        o.couponCode,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="skn-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
