import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatPKR } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";
import { IconPackage, IconHeart, IconMapPin, IconArrowRight } from "@/components/Icons";
import { getAccountUser } from "./_session";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?callbackUrl=/account");

  const [orders, wishlistCount, addressCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { items: true } } },
    }),
    prisma.wishlist.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
  ]);

  const firstName = (user.name || "there").split(" ")[0];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My Account" }]} />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink md:text-3xl">
        Hello, {firstName}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/account/orders"
          className="flex items-center gap-4 rounded border border-border bg-card p-5 transition hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-soft-bg text-primary">
            <IconPackage />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">My Orders</span>
            <span className="block text-xs text-muted">Track and review your orders</span>
          </span>
        </Link>
        <Link
          href="/account/wishlist"
          className="flex items-center gap-4 rounded border border-border bg-card p-5 transition hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-soft-bg text-primary">
            <IconHeart />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Wishlist</span>
            <span className="block text-xs text-muted">{wishlistCount} saved items</span>
          </span>
        </Link>
        <Link
          href="/account/addresses"
          className="flex items-center gap-4 rounded border border-border bg-card p-5 transition hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-soft-bg text-primary">
            <IconMapPin />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Addresses</span>
            <span className="block text-xs text-muted">{addressCount} saved addresses</span>
          </span>
        </Link>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Recent orders</h2>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all <IconArrowRight />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="rounded border border-border bg-card p-8 text-center">
            <p className="text-sm font-semibold text-ink">No orders yet</p>
            <p className="mt-1 text-sm text-muted">
              Your orders will show up here once you place one.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/account/orders/${o.id}`}
                className="flex items-center justify-between gap-3 rounded border border-border bg-card p-4 transition hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{o.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {new Date(o.createdAt).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {o._count.items} {o._count.items === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink">{formatPKR(o.total)}</p>
                  <p className="text-xs text-muted">{ORDER_STATUS_LABELS[o.status] ?? o.status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
