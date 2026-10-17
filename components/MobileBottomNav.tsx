"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { MOBILE_BOTTOM_NAV } from "@/lib/constants";
import { useCart } from "./CartProvider";
import {
  IconHome,
  IconGrid,
  IconSearch,
  IconCart,
  IconUser,
} from "./Icons";
import { cn } from "@/lib/utils";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "/": IconHome,
  "/categories": IconGrid,
  "/search": IconSearch,
  "/cart": IconCart,
  "/account": IconUser,
};

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav
      aria-label="Mobile"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {MOBILE_BOTTOM_NAV.map((item) => {
          const Icon = ICONS[item.href] ?? IconHome;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(item.href + "/");
          const isCart = item.href === "/cart";
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                  active ? "text-accent" : "text-muted"
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {isCart && count > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold leading-none text-white"
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
