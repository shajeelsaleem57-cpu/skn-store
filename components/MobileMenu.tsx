"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu, IconX, IconChevronRight } from "./Icons";
import { cn } from "@/lib/utils";

export type MenuLink = { label: string; href: string };
export type MenuCategory = { name: string; slug: string };

export default function MobileMenu({
  links,
  categories,
}: {
  links: MenuLink[];
  categories: MenuCategory[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open ]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="rounded-full p-2 text-ink transition-colors hover:bg-soft-bg md:hidden"
      >
        <IconMenu className="h-6 w-6" />
      </button>

      <div
        className={cn(
          "no-print fixed inset-0 z-[60] md:hidden",
          open ? "" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-[85%] max-w-xs flex-col bg-surface shadow-xl transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full"
          )}
          role="dialog"
          aria-label="Site menu"
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <span className="text-lg font-extrabold tracking-tight">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-full p-2 hover:bg-soft-bg"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.href + l.label}>
                  <Link
                    href={l.href}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-soft-bg"
                  >
                    {l.label}
                    <IconChevronRight className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>

            {categories.length > 0 && (
              <>
                <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Categories
                </p>
                <ul className="space-y-1">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/shop?category=${encodeURIComponent(c.slug)}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] text-ink hover:bg-soft-bg"
                      >
                        {c.name}
                        <IconChevronRight className="h-4 w-4 text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>

          <div className="border-t border-border p-4">
            <Link
              href="/account"
              className="block rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
            >
              My Account
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
