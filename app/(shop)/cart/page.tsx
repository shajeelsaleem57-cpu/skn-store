"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/Toast";
import QuantitySelector from "@/components/QuantitySelector";
import EmptyState from "@/components/EmptyState";
import { IconTrash, IconArrowRight } from "@/components/Icons";
import { DELIVERY_FEE_FLAT, FREE_DELIVERY_THRESHOLD } from "@/lib/constants";
import { formatPKR, effectivePrice } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, count } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Enter a coupon code first.");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCoupon({ code: couponCode.trim().toUpperCase(), discount: data.discount });
        toast("Coupon applied");
      } else {
        setCoupon(null);
        setCouponError(data.message || "Invalid coupon code.");
      }
    } catch {
      setCouponError("Could not validate the coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const discount = coupon?.discount ?? 0;
  const deliveryFee =
    FREE_DELIVERY_THRESHOLD != null && subtotal - discount >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_FEE_FLAT;
  const total = Math.max(0, subtotal - discount) + (items.length > 0 ? deliveryFee : 0);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Browse our products and find something you love."
          actionLabel="Continue shopping"
          actionHref="/shop"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink md:text-3xl">
        Shopping Cart <span className="text-base font-normal text-muted">({count} items)</span>
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded border border-border bg-card p-4"
            >
              <Link
                href={`/product/${item.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-soft-bg sm:h-28 sm:w-28"
              >
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover" sizes="112px" />
                ) : null}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      className="line-clamp-2 text-sm font-semibold text-ink hover:underline"
                    >
                      {item.title}
                    </Link>
                    {item.variant ? (
                      <p className="mt-0.5 text-xs text-muted">{item.variant}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeItem(item.id, item.variant);
                      toast("Removed from cart");
                    }}
                    aria-label={`Remove ${item.title}`}
                    className="rounded p-1.5 text-muted transition hover:bg-soft-bg hover:text-error"
                  >
                    <IconTrash />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantitySelector
                    value={item.qty}
                    onChange={(q) => updateQty(item.id, q, item.variant)}
                    min={1}
                    max={99}
                  />
                  <div className="text-right">
                    <p className="text-base font-bold text-ink">
                      {formatPKR(effectivePrice(item.price, item.salePrice) * item.qty)}
                    </p>
                    <p className="text-xs text-muted">
                      {formatPKR(effectivePrice(item.price, item.salePrice))} each
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 self-start text-sm font-semibold text-primary hover:underline"
          >
            Continue shopping
          </Link>
        </div>

        <div className="lg:col-span-1">
          <div className="flex flex-col gap-4 rounded border border-border bg-card p-6 lg:sticky lg:top-24">
            <h2 className="text-base font-bold text-ink">Order summary</h2>

            <div>
              <label htmlFor="coupon" className="mb-1 block text-sm font-medium text-ink">
                Coupon code
              </label>
              {coupon ? (
                <div className="flex items-center justify-between rounded border border-success bg-soft-bg px-3 py-2">
                  <span className="text-sm font-semibold text-success">{coupon.code} applied</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCoupon(null);
                      setCouponCode("");
                    }}
                    className="text-xs font-medium text-muted hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      id="coupon"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="min-w-0 flex-1 rounded border border-border px-3 py-2 text-sm uppercase text-ink"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {couponLoading ? "…" : "Apply"}
                    </button>
                  </div>
                  {couponError ? <p className="mt-1 text-xs text-error">{couponError}</p> : null}
                </>
              )}
            </div>

            <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPKR(subtotal)}</dd>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-success">
                  <dt>Coupon discount</dt>
                  <dd className="font-medium">−{formatPKR(discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted">Delivery (estimated)</dt>
                <dd className="font-medium text-ink">
                  {deliveryFee === 0 ? "Free" : formatPKR(deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt className="text-ink">Total</dt>
                <dd className="text-ink">{formatPKR(total)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="inline-flex items-center justify-center gap-2 rounded bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Proceed to Checkout <IconArrowRight />
            </button>
            <p className="text-center text-xs text-muted">
              Cash on Delivery available — pay when your order arrives.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
