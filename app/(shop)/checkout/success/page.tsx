import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSetting, getWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppLink } from "@/lib/utils";
import { formatPKR } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";
import { IconCheck, IconChat, IconArrowRight } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNumber = searchParams.order?.trim();
  if (!orderNumber) notFound();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  const [storeName, whatsappNumber, whatsappDisplay, deliveryInfo, confirmMsgTemplate] = await Promise.all([
    getSetting("store_name", "SKN Store"),
    getWhatsAppNumber(),
    getSetting("whatsapp_display", "0328 7533227"),
    getSetting("delivery_info", "2–4 working days across Pakistan"),
    getSetting(
      "confirm_msg_customer",
      "Assalam-o-Alaikum! I confirm my COD order {order_id}. Name: {name}, Total: Rs. {total}."
    ),
  ]);

  const supportHref = buildWhatsAppLink(
    whatsappNumber,
    `Hello ${storeName}, I need help with my order ${orderNumber}.`
  );

  // If the order record isn't visible on this server instance yet (ephemeral DB),
  // still show the confirmation with the order number from the URL.
  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Order Confirmed" }]} />
        <div className="mt-6 rounded border border-border bg-card p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soft-bg text-success">
            <IconCheck />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">Thank you! Your order is received.</h1>
          <p className="mt-2 text-sm text-muted">
            One last step — tap below to confirm your order on WhatsApp so we can dispatch it quickly.
          </p>
          <p className="mt-4 inline-block rounded bg-soft-bg px-4 py-2 text-lg font-bold tracking-wide text-ink">
            {orderNumber}
          </p>
          <p className="mt-2 text-xs text-muted">
            Please save your order number for tracking.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={`/track-order?order=${encodeURIComponent(orderNumber)}`}
              className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white"
            >
              Track your order <IconArrowRight />
            </Link>
            <a
              href={supportHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-sm font-medium text-ink"
            >
              <IconChat /> WhatsApp us
            </a>
          </div>
        </div>
      </main>
    );
  }

  const needsConfirmation = order.status === "PENDING_CONFIRMATION";
  const fillConfirmTemplate = (tpl: string) =>
    tpl
      .replaceAll("{order_id}", order.orderNumber)
      .replaceAll("{name}", order.fullName)
      .replaceAll("{total}", order.total.toLocaleString("en-PK"));
  const customerConfirmHref = buildWhatsAppLink(whatsappNumber, fillConfirmTemplate(confirmMsgTemplate));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Order Confirmed" }]} />

      <div className="mt-6 rounded border border-border bg-card p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soft-bg text-success">
          <IconCheck />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">Thank you! Your order is received.</h1>
        <p className="mt-2 text-sm text-muted">
          {needsConfirmation
            ? "One last step — confirm your order on WhatsApp so we can dispatch it without delay."
            : "We have received your order and will process it shortly."}
        </p>
        <p className="mt-4 inline-block rounded bg-soft-bg px-4 py-2 text-lg font-bold tracking-wide text-ink">
          {order.orderNumber}
        </p>
        <p className="mt-2 text-xs text-muted">
          Please save your order number for tracking.
        </p>
        {needsConfirmation ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">
              Confirm on WhatsApp to start dispatch
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Tap the button — WhatsApp opens with your confirmation message ready to send.
            </p>
            <a
              href={customerConfirmHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded bg-success px-6 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              <IconChat /> Confirm order on WhatsApp
            </a>
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-bold text-ink">Order summary</h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-soft-bg">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover" sizes="56px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                <p className="text-xs text-muted">
                  {item.variant ? `${item.variant} · ` : ""}Qty {item.qty}
                </p>
              </div>
              <p className="text-sm font-semibold text-ink">{formatPKR(item.price * item.qty)}</p>
            </div>
          ))}
        </div>
        <dl className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-medium text-ink">{formatPKR(order.subtotal)}</dd>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between text-success">
              <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
              <dd className="font-medium">−{formatPKR(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted">Delivery fee</dt>
            <dd className="font-medium text-ink">
              {order.deliveryFee === 0 ? "Free" : formatPKR(order.deliveryFee)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt className="text-ink">Total (Cash on Delivery)</dt>
            <dd className="text-ink">{formatPKR(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded border border-border bg-card p-6">
          <h2 className="mb-2 text-base font-bold text-ink">Delivery details</h2>
          <p className="text-sm font-medium text-ink">{order.fullName}</p>
          <p className="mt-1 text-sm text-muted">{order.address}</p>
          <p className="text-sm text-muted">
            {order.city}, {order.province}
            {order.postalCode ? ` ${order.postalCode}` : ""}
          </p>
          <p className="mt-2 text-sm text-muted">Estimated delivery: {deliveryInfo}</p>
        </div>
        <div className="rounded border border-border bg-card p-6">
          <h2 className="mb-2 text-base font-bold text-ink">Need help?</h2>
          <p className="text-sm text-muted">
            Message us on WhatsApp at {whatsappDisplay} with your order number and we will assist
            you right away.
          </p>
          <a
            href={supportHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded bg-success px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <IconChat /> WhatsApp Support
          </a>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
          className="inline-flex items-center gap-2 rounded border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-soft-bg"
        >
          Track your order
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Continue shopping <IconArrowRight />
        </Link>
      </div>
    </main>
  );
}
