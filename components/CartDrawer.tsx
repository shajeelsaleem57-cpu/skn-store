"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import QuantitySelector from "./QuantitySelector";
import { IconX, IconTrash, IconArrowRight } from "./Icons";
import { cn, effectivePrice, formatPKR } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, setOpen, updateQty, removeItem, subtotal } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setOpen]);

  return (
    <div
      className={cn("fixed inset-0 z-[70]", isOpen ? "" : "pointer-events-none")}
      aria-hidden={!isOpen}
    >
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-ink">
            Your Cart{" "}
            <span className="text-sm font-normal text-muted">
              ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="rounded-full p-2 hover:bg-soft-bg"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-lg font-semibold text-ink">Your cart is empty</p>
            <p className="text-sm text-muted">
              Browse our products and add something you love.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto p-4">
              {items.map((item) => (
                <li key={`${item.id}::${item.variant ?? ""}`} className="flex gap-3 py-3">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-soft-bg"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => setOpen(false)}
                        className="line-clamp-2 text-sm font-medium text-ink hover:underline"
                      >
                        {item.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.variant)}
                        aria-label={`Remove ${item.title} from cart`}
                        className="shrink-0 rounded p-1 text-muted hover:bg-soft-bg hover:text-error"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                    {item.variant && (
                      <p className="mt-0.5 text-xs text-muted">{item.variant}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QuantitySelector
                        value={item.qty}
                        onChange={(v) => updateQty(item.id, v, item.variant)}
                        min={1}
                        max={99}
                      />
                      <p className="text-sm font-bold text-ink">
                        {formatPKR(
                          effectivePrice(item.price, item.salePrice) * item.qty
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="text-base font-bold text-ink">
                  {formatPKR(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Delivery charges calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Proceed to Checkout
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full rounded-lg px-6 py-2.5 text-sm font-medium text-ink hover:bg-soft-bg"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
