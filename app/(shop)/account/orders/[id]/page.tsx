import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSetting, getWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppLink } from "@/lib/utils";
import { ORDER_TIMELINE, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatPKR, cn } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";
import { IconCheck, IconChat } from "@/components/Icons";
import { getAccountUser } from "../../_session";

export const metadata: Metadata = { title: "Order Details" };

const TERMINAL_STATES = ["CANCELLED", "RETURNED", "REFUNDED"];

export default async function AccountOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getAccountUser();
  if (!user) redirect(`/login?callbackUrl=/account/orders/${params.id}`);

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: user.id },
    include: { items: true },
  });
  if (!order) notFound();

  const [storeName, whatsappNumber] = await Promise.all([
    getSetting("store_name", "SKN Store"),
    getWhatsAppNumber(),
  ]);

  const isTerminal = TERMINAL_STATES.includes(order.status);
  const currentIndex = ORDER_TIMELINE.indexOf(order.status as (typeof ORDER_TIMELINE)[number]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: order.orderNumber },
        ]}
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink">{order.orderNumber}</h1>
        <span className="rounded-full bg-soft-bg px-3 py-1 text-xs font-semibold text-primary">
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Placed on{" "}
        {new Date(order.createdAt).toLocaleDateString("en-PK", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {!isTerminal ? (
        <div className="mt-6 rounded border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-bold text-ink">Delivery progress</h2>
          <ol className="flex flex-col gap-0">
            {ORDER_TIMELINE.map((step, i) => {
              const done = currentIndex === -1 ? false : i < currentIndex;
              const current = i === currentIndex;
              return (
                <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < ORDER_TIMELINE.length - 1 ? (
                    <span
                      className={cn(
                        "absolute left-[13px] top-7 h-full w-0.5",
                        done || current ? "bg-primary" : "bg-border"
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                      done || current
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white text-muted"
                    )}
                  >
                    {done || current ? <IconCheck /> : <span className="h-2 w-2 rounded-full bg-border" />}
                  </span>
                  <p
                    className={cn(
                      "pt-0.5 text-sm",
                      current ? "font-bold text-ink" : done ? "font-medium text-ink" : "text-muted"
                    )}
                  >
                    {ORDER_STATUS_LABELS[step]}
                  </p>
                </li>
              );
            })}
          </ol>
          {order.trackingNumber ? (
            <p className="mt-2 text-sm text-muted">
              Tracking: <span className="font-medium text-ink">{order.trackingNumber}</span>
              {order.courier ? ` via ${order.courier}` : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 rounded border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-bold text-ink">Items</h2>
        <div className="flex flex-col gap-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-soft-bg">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" />
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
          <h2 className="mb-2 text-base font-bold text-ink">Delivery address</h2>
          <p className="text-sm font-medium text-ink">{order.fullName}</p>
          <p className="mt-1 text-sm text-muted">{order.address}</p>
          <p className="text-sm text-muted">
            {order.city}, {order.province}
            {order.postalCode ? ` ${order.postalCode}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted">{order.mobile}</p>
        </div>
        <div className="rounded border border-border bg-card p-6">
          <h2 className="mb-2 text-base font-bold text-ink">Need help with this order?</h2>
          <p className="text-sm text-muted">
            Message us on WhatsApp with your order number and we will assist you.
          </p>
          <a
            href={buildWhatsAppLink(
              whatsappNumber,
              `Hello ${storeName}, I need help with my order ${order.orderNumber}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded bg-success px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <IconChat /> WhatsApp Support
          </a>
        </div>
      </div>

      <Link
        href="/account/orders"
        className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
      >
        Back to all orders
      </Link>
    </main>
  );
}
