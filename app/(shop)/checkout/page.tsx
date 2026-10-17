"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import { IconCash, IconChevronDown } from "@/components/Icons";
import { PROVINCES, DELIVERY_FEE_FLAT, FREE_DELIVERY_THRESHOLD } from "@/lib/constants";
import { formatPKR, isValidPakistaniMobile, normalizePakistaniMobile, effectivePrice } from "@/lib/utils";

type FormState = {
  fullName: string;
  mobile: string;
  whatsapp: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
};

const INITIAL: FormState = {
  fullName: "",
  mobile: "",
  whatsapp: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  notes: "",
};

const inputCls =
  "w-full rounded border border-border px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [placing, setPlacing] = useState(false);

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Enter a coupon code first.");
      return;
    }
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
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (form.fullName.trim().length < 3) e.fullName = "Please enter your full name.";
    if (!isValidPakistaniMobile(form.mobile))
      e.mobile = "Enter a valid Pakistani mobile number (e.g. 0328 7533227).";
    if (form.whatsapp.trim() && !isValidPakistaniMobile(form.whatsapp))
      e.whatsapp = "Enter a valid Pakistani mobile number or leave blank.";
    if (form.address.trim().length < 5) e.address = "Please enter your complete address.";
    if (form.city.trim().length < 2) e.city = "Please enter your city.";
    if (!form.province || !(PROVINCES as readonly string[]).includes(form.province))
      e.province = "Please select your province.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) {
      toast("Please fix the highlighted fields.");
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName: form.fullName.trim(),
            mobile: normalizePakistaniMobile(form.mobile) || form.mobile.trim(),
            whatsapp: form.whatsapp.trim()
              ? normalizePakistaniMobile(form.whatsapp) || form.whatsapp.trim()
              : undefined,
            address: form.address.trim(),
            city: form.city.trim(),
            province: form.province,
            postalCode: form.postalCode.trim() || undefined,
            notes: form.notes.trim() || undefined,
          },
          items: items.map((i) => ({ id: i.id, qty: i.qty, variant: i.variant })),
          couponCode: coupon?.code,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not place your order. Please try again.");
      clearCart();
      router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not place your order.");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Your cart is empty"
          description="Add some products to your cart before checking out."
          actionLabel="Continue shopping"
          actionHref="/shop"
        />
      </main>
    );
  }

  const discount = coupon?.discount ?? 0;
  const deliveryFee =
    FREE_DELIVERY_THRESHOLD != null && subtotal - discount >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_FEE_FLAT;
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  const field = (
    key: keyof FormState,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <label htmlFor={`co-${key}`} className="mb-1 block text-sm font-medium text-ink">
        {label} {props.required ? <span className="text-error">*</span> : null}
      </label>
      <input
        id={`co-${key}`}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className={`${inputCls} ${errors[key] ? "border-error" : ""}`}
        {...props}
      />
      {errors[key] ? <p className="mt-1 text-xs text-error">{errors[key]}</p> : null}
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink md:text-3xl">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Delivery details form */}
        <div className="lg:col-span-2">
          <div className="rounded border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-bold text-ink">Delivery details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">{field("fullName", "Full name", { required: true, autoComplete: "name" })}</div>
              <div className="sm:col-span-1">{field("mobile", "Mobile number", { required: true, inputMode: "tel", autoComplete: "tel", placeholder: "0328 7533227" })}</div>
              <div className="sm:col-span-1">{field("whatsapp", "WhatsApp number (optional)", { inputMode: "tel", placeholder: "Same as mobile if blank" })}</div>
              <div className="sm:col-span-1">{field("city", "City", { required: true, autoComplete: "address-level2" })}</div>
              <div className="sm:col-span-2">
                <label htmlFor="co-address" className="mb-1 block text-sm font-medium text-ink">
                  Complete address <span className="text-error">*</span>
                </label>
                <textarea
                  id="co-address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  rows={2}
                  placeholder="House, street, area…"
                  className={`${inputCls} ${errors.address ? "border-error" : ""}`}
                />
                {errors.address ? <p className="mt-1 text-xs text-error">{errors.address}</p> : null}
              </div>
              <div>
                <label htmlFor="co-province" className="mb-1 block text-sm font-medium text-ink">
                  Province <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    id="co-province"
                    value={form.province}
                    onChange={(e) => set("province", e.target.value)}
                    className={`${inputCls} appearance-none pr-8 ${errors.province ? "border-error" : ""}`}
                  >
                    <option value="">Select province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted">
                    <IconChevronDown />
                  </span>
                </div>
                {errors.province ? <p className="mt-1 text-xs text-error">{errors.province}</p> : null}
              </div>
              <div>{field("postalCode", "Postal code (optional)", { inputMode: "numeric" })}</div>
              <div className="sm:col-span-2">
                <label htmlFor="co-notes" className="mb-1 block text-sm font-medium text-ink">
                  Order notes (optional)
                </label>
                <textarea
                  id="co-notes"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  placeholder="Anything we should know about your order?"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-bold text-ink">Payment method</h2>
            <label className="flex cursor-pointer items-center gap-3 rounded border border-primary bg-soft-bg p-4">
              <input type="radio" checked readOnly className="accent-black" aria-label="Cash on Delivery" />
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary">
                <IconCash />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">Cash on Delivery</span>
                <span className="block text-xs text-muted">You pay when your order arrives.</span>
              </span>
            </label>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-4 rounded border border-border bg-card p-6 lg:sticky lg:top-24">
            <h2 className="text-base font-bold text-ink">Order summary</h2>
            <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-soft-bg">
                    {i.image ? (
                      <Image src={i.image} alt={i.title} fill className="object-cover" sizes="56px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{i.title}</p>
                    <p className="text-xs text-muted">
                      {i.variant ? `${i.variant} · ` : ""}Qty {i.qty}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    {formatPKR(effectivePrice(i.price, i.salePrice) * i.qty)}
                  </p>
                </div>
              ))}
            </div>

            <div>
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
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      aria-label="Coupon code"
                      className="min-w-0 flex-1 rounded border border-border px-3 py-2 text-sm uppercase text-ink"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Apply
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
                  <dt>Discount</dt>
                  <dd className="font-medium">−{formatPKR(discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted">Delivery fee</dt>
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
              onClick={placeOrder}
              disabled={placing}
              className="inline-flex items-center justify-center gap-2 rounded bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {placing ? "Placing your order…" : "Place COD Order"}
            </button>
            <p className="text-center text-xs font-medium text-muted">
              You pay when your order arrives.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
