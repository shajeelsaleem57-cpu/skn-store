"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { IconCheck, IconAlert } from "@/components/Icons";
import { ORDER_TIMELINE, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatPKR, cn } from "@/lib/utils";

type TrackedItem = {
  title: string;
  variant: string | null;
  price: number;
  qty: number;
  image: string | null;
};

type TrackedOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  items: TrackedItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  city: string;
  province: string;
};

const TERMINAL_STATES = ["CANCELLED", "RETURNED", "REFUNDED"];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError("Please enter your order number.");
      return;
    }
    if (!mobile.trim()) {
      setError("Please enter the mobile number used for the order.");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(
        `/api/track-order?orderNumber=${encodeURIComponent(orderNumber.trim())}&mobile=${encodeURIComponent(mobile.trim())}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Order not found.");
      setOrder(data.order as TrackedOrder);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not find that order. Please check the details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isTerminal = order ? TERMINAL_STATES.includes(order.status) : false;
  const currentIndex = order ? ORDER_TIMELINE.indexOf(order.status as (typeof ORDER_TIMELINE)[number]) : -1;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track Order" }]} />
      <h1 className="mb-2 mt-2 text-2xl font-bold text-ink md:text-3xl">Track your order</h1>
      <p className="mb-6 text-sm text-muted">
        Enter your order number and the mobile number you used when placing the order.
      </p>

      <form
        onSubmit={lookup}
        className="rounded border border-border bg-card p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="to-order" className="mb-1 block text-sm font-medium text-ink">
              Order number
            </label>
            <input
              id="to-order"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. SKN-20261011-1234"
              className="w-full rounded border border-border px-3 py-2.5 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="to-mobile" className="mb-1 block text-sm font-medium text-ink">
              Mobile number
            </label>
            <input
              id="to-mobile"
              type="tel"
              inputMode="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="0328 7533227"
              className="w-full rounded border border-border px-3 py-2.5 text-sm text-ink"
            />
          </div>
        </div>
        {error ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-error">
            <IconAlert /> {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Searching…" : "Track order"}
        </button>
      </form>

      {order ? (
        <div className="mt-6 flex flex-col gap-6">
          <div className="rounded border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted">Order</p>
                <p className="text-lg font-bold text-ink">{order.orderNumber}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  isTerminal ? "bg-soft-bg text-muted" : "bg-soft-bg text-primary"
                )}
              >
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · Delivering to {order.city}, {order.province}
            </p>

            {isTerminal ? (
              <div className="mt-6 rounded border border-border bg-soft-bg p-4 text-sm text-muted">
                This order is{" "}
                <span className="font-semibold text-ink">
                  {(ORDER_STATUS_LABELS[order.status] ?? order.status).toLowerCase()}
                </span>
                . If you need help, please contact us on WhatsApp with your order number.
              </div>
            ) : (
              <ol className="mt-6 flex flex-col gap-0">
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
                      <div className="pt-0.5">
                        <p
                          className={cn(
                            "text-sm",
                            current ? "font-bold text-ink" : done ? "font-medium text-ink" : "text-muted"
                          )}
                        >
                          {ORDER_STATUS_LABELS[step]}
                          {current ? " — current status" : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {order.trackingNumber ? (
              <div className="mt-4 rounded bg-soft-bg p-3 text-sm">
                <p className="font-medium text-ink">
                  Courier{order.courier ? `: ${order.courier}` : ""} — Tracking: {order.trackingNumber}
                </p>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    Track with courier
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded border border-border bg-card p-6">
            <h2 className="mb-3 text-base font-bold text-ink">Items</h2>
            <div className="flex flex-col gap-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm">
                  <p className="min-w-0 flex-1 text-ink">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted">
                      {item.variant ? ` (${item.variant})` : ""} × {item.qty}
                    </span>
                  </p>
                  <p className="font-semibold text-ink">{formatPKR(item.price * item.qty)}</p>
                </div>
              ))}
            </div>
            <dl className="mt-4 flex flex-col gap-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-ink">{formatPKR(order.subtotal)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-success">
                  <dt>Discount</dt>
                  <dd>−{formatPKR(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="text-ink">{order.deliveryFee === 0 ? "Free" : formatPKR(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold">
                <dt className="text-ink">Total</dt>
                <dd className="text-ink">{formatPKR(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : !error && !loading ? (
        <div className="mt-6">
          <EmptyState
            title="No order looked up yet"
            description="Your order status and delivery timeline will appear here."
          />
        </div>
      ) : null}
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-sm text-muted">Loading…</p>
        </main>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
