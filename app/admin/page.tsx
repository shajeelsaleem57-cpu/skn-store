import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatPKR, parseImages } from "@/lib/utils";
import { Card, PageHeader, Price, StatCard, StatusBadge, TableShell, Thumb } from "./_components/ui";

export const dynamic = "force-dynamic";

const EXCLUDED: string[] = ["CANCELLED", "RETURNED", "REFUNDED"];
const PENDING: string[] = ["NEW", "PENDING_CONFIRMATION"];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AdminDashboard() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [
    revenueAgg,
    todayAgg,
    validCount,
    totalOrders,
    pendingOrders,
    customers,
    productsCount,
    stockRows,
    statusGroups,
    bestSellers,
    weekOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: EXCLUDED } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { notIn: EXCLUDED }, createdAt: { gte: todayStart } },
    }),
    prisma.order.count({ where: { status: { notIn: EXCLUDED } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: PENDING } } }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.product.count(),
    prisma.product.findMany({ select: { stock: true, lowStockThreshold: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.product.findMany({
      orderBy: { soldCount: "desc" },
      take: 5,
      select: { id: true, title: true, soldCount: true, price: true, salePrice: true, images: true },
    }),
    prisma.order.findMany({
      where: { status: { notIn: EXCLUDED }, createdAt: { gte: weekAgo } },
      select: { total: true, createdAt: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        fullName: true,
        total: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  const revenue = revenueAgg._sum.total ?? 0;
  const todaySales = todayAgg._sum.total ?? 0;
  const aov = validCount > 0 ? Math.round(revenue / validCount) : 0;
  const lowStock = stockRows.filter((p) => p.stock <= p.lowStockThreshold).length;

  const statusCount = new Map(statusGroups.map((g) => [g.status, g._count.status]));

  // last 7 days revenue buckets
  const days: { key: string; label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-PK", { weekday: "short" }),
      total: 0,
    });
  }
  const byDay = new Map(days.map((d) => [d.key, d]));
  for (const o of weekOrders) {
    const b = byDay.get(dayKey(o.createdAt));
    if (b) b.total += o.total;
  }
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  const W = 700;
  const H = 220;
  const PAD = 28;
  const barW = (W - PAD * 2) / 7;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Store overview at a glance" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Revenue" value={formatPKR(revenue)} sub={`${validCount} valid orders`} />
        <StatCard label="Today's Sales" value={formatPKR(todaySales)} />
        <StatCard label="Total Orders" value={String(totalOrders)} sub={`${pendingOrders} need attention`} />
        <StatCard label="Avg. Order Value" value={formatPKR(aov)} />
        <StatCard label="Customers" value={String(customers)} />
        <StatCard label="Products" value={String(productsCount)} />
        <StatCard label="Low Stock" value={String(lowStock)} sub="at or below threshold" />
        <StatCard label="Pending Orders" value={String(pendingOrders)} sub="new + pending confirmation" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Revenue — last 7 days">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Revenue last 7 days">
            {days.map((d, i) => {
              const h = Math.max(4, ((H - PAD * 2 - 20) * d.total) / maxDay);
              const x = PAD + i * barW + barW * 0.2;
              const y = H - PAD - h;
              return (
                <g key={d.key}>
                  <rect x={x} y={y} width={barW * 0.6} height={h} rx={4} fill="#111827" opacity={d.total ? 1 : 0.15} />
                  <text x={x + barW * 0.3} y={H - 10} textAnchor="middle" fontSize={11} fill="#6b7280">
                    {d.label}
                  </text>
                  {d.total > 0 ? (
                    <text x={x + barW * 0.3} y={y - 6} textAnchor="middle" fontSize={10} fill="#374151">
                      {(d.total / 1000).toFixed(1)}k
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </Card>

        <Card title="Orders by status">
          <div className="divide-y divide-gray-100">
            {ORDER_STATUSES.map((s) => (
              <div key={s} className="flex items-center justify-between py-2">
                <StatusBadge status={s} />
                <span className="text-sm font-semibold text-gray-900">{statusCount.get(s) ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Best sellers">
          {bestSellers.length === 0 ? (
            <p className="text-sm text-gray-500">No sales recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {bestSellers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2">
                  <span className="w-6 text-sm font-bold text-gray-400">{i + 1}</span>
                  <Thumb src={parseImages(p.images)[0]} alt={p.title} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="block truncate text-sm font-medium text-gray-900 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-gray-500">
                      <Price value={p.salePrice ?? p.price} /> · {p.soldCount} sold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Recent orders"
          actions={
            <Link href="/admin/orders" className="text-xs font-medium text-gray-600 hover:underline">
              View all
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="block truncate text-sm font-medium text-gray-900 hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="truncate text-xs text-gray-500">
                      {o.fullName} · {o._count.items} items
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Price value={o.total} className="text-sm font-semibold" />
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Low stock alerts">
          <LowStockList />
        </Card>
      </div>
    </div>
  );
}

async function LowStockList() {
  const rows = await prisma.product.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, stock: true, lowStockThreshold: true, images: true },
    orderBy: { stock: "asc" },
    take: 50,
  });
  const low = rows.filter((p) => p.stock <= p.lowStockThreshold).slice(0, 10);
  if (low.length === 0) return <p className="text-sm text-gray-500">All stocked up. Nothing running low.</p>;
  return (
    <TableShell headers={["Product", "Stock", "Threshold", ""]}>
      {low.map((p) => (
        <tr key={p.id}>
          <td className="px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Thumb src={parseImages(p.images)[0]} alt={p.title} />
              <Link href={`/admin/products/${p.id}`} className="font-medium text-gray-900 hover:underline">
                {p.title}
              </Link>
            </div>
          </td>
          <td className="px-4 py-2.5">
            <span className={p.stock === 0 ? "font-bold text-red-600" : "font-semibold text-amber-700"}>{p.stock}</span>
          </td>
          <td className="px-4 py-2.5 text-gray-500">{p.lowStockThreshold}</td>
          <td className="px-4 py-2.5 text-right">
            <Link href={`/admin/products/${p.id}`} className="text-xs font-medium text-gray-600 hover:underline">
              Restock
            </Link>
          </td>
        </tr>
      ))}
    </TableShell>
  );
}
