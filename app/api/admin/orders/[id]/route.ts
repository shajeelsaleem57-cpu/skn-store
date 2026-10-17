import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/constants";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const existing = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, confirmedAt: true },
  });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const data: {
    status?: string;
    courier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    internalNotes?: string | null;
    confirmedAt?: Date | null;
  } = {};

  // Dispatch guard: an order awaiting WhatsApp confirmation can never move
  // into the fulfillment pipeline until it is confirmed or the hold is cleared.
  const DISPATCH_STATUSES = ["PROCESSING", "PACKED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED"];
  if (body.status !== undefined) {
    const s = String(body.status);
    if (!(ORDER_STATUSES as readonly string[]).includes(s)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }
    if (
      existing.status === "PENDING_CONFIRMATION" &&
      DISPATCH_STATUSES.includes(s)
    ) {
      return NextResponse.json(
        { error: "This order is awaiting WhatsApp confirmation and cannot enter dispatch. Confirm it or clear the hold first." },
        { status: 400 }
      );
    }
    data.status = s;
    if (s === "CONFIRMED" && existing.status === "PENDING_CONFIRMATION") {
      data.confirmedAt = new Date();
    }
  }
  const strOrNull = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s ? s : null;
  };
  if (body.courier !== undefined) data.courier = strOrNull(body.courier);
  if (body.trackingNumber !== undefined) data.trackingNumber = strOrNull(body.trackingNumber);
  if (body.trackingUrl !== undefined) data.trackingUrl = strOrNull(body.trackingUrl);
  if (body.internalNotes !== undefined) data.internalNotes = strOrNull(body.internalNotes);

  const order = await prisma.order.update({
    where: { id: params.id },
    data,
    include: { items: true },
  });
  return NextResponse.json({ order });
}
