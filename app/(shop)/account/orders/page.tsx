import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatPKR } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { getAccountUser } from "../_session";

export const metadata: Metadata = { title: "My Orders" };

export default async function AccountOrdersPage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?callbackUrl=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/account" },
          { label: "Orders" },
        ]}
      />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink md:text-3xl">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order it will appear here."
          actionLabel="Start shopping"
          actionHref="/shop"
        />
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
                  · {o._count.items} {o._count.items === 1 ? "item" : "items"} ·{" "}
                  {ORDER_STATUS_LABELS[o.status] ?? o.status}
                </p>
              </div>
              <p className="text-sm font-bold text-ink">{formatPKR(o.total)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
