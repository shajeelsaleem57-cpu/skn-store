"use client";

import { useCart } from "./CartProvider";
import { IconCart } from "./Icons";

export default function CartButton() {
  const { count, setOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
      className="relative rounded-full p-2 text-ink transition-colors hover:bg-soft-bg"
    >
      <IconCart className="h-6 w-6" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sale px-1 text-[11px] font-bold leading-none text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
