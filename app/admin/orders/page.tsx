import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  Breadcrumbs,
  EmptyState,
  PageHeader,
  Pagination,
  Price,
  StatusBadge,
  TableShell,
  btnPrimary,
  btnSecondary,
  inputCls,
} from "../_components/ui";
import { IconDownload, IconEye, IconSearch } from "../_components/icons";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function param(sp: { [k: string]: string | string[] | undefined }, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Math.max(1, parseInt(param(searchParams, "page") || "1", 10) || 1);
  const q = param(searchParams, "q").trim();
  const status = param(searchParams, "status");
  const date = param(searchParams, "date");
  const confirm = param(searchParams, "confirm"); // "awaiting" | ""

  const where: Prisma.OrderWhereInput = {};
  if (q) where.OR = [{ orderNumber: { contains: q } }, { fullName: { contains: q } }, { mobile: { contains: q } }];
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) where.status = status as (typeof ORDER_STATUSES)[number];
  if (confirm === "awaiting") where.status = "PENDING_CONFIRMATION";
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T00:00:00`);
    end.setDate(end.getDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  const [total, orders, awaitingCount] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        fullName: true,
        mobile: true,
        city: true,
        total: true,
        status: true,
        riskFlags: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where: { status: "PENDING_CONFIRMATION" } }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (status) exportParams.set("status", status);
  if (confirm) exportParams.set("confirm", confirm);
  if (date) exportParams.set("date", date);
  const exportHref = `/api/admin/orders/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Orders" }]} />
      <PageHeader
        title="Orders"
        subtitle={`${total} order${total === 1 ? "" : "s"}`}
        actions={
          <a href={exportHref} className={btnSecondary}>
            <IconDownload className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="min-w-[13rem] flex-1">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input name="q" defaultValue={q} placeholder="Order #, name or mobile…" className={`${inputCls} pl-9`} />
          </div>
        </div>
        <select name="status" defaultValue={status} className={inputCls + " w-auto"}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input type="date" name="date" defaultValue={date} className={inputCls + " w-auto"} />
        <button type="submit" className={btnPrimary}>
          Filter
        </button>
        {q || status || date || confirm ? (
          <Link href="/admin/orders" className="text-sm text-gray-500 hover:underline">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${!confirm ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          All orders
        </Link>
        <Link
          href="/admin/orders?confirm=awaiting"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${confirm === "awaiting" ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-900 hover:bg-amber-200"}`}
        >
          ⏳ Awaiting WhatsApp confirmation ({awaitingCount})
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders found" message="Try adjusting your filters." />
      ) : (
        <TableShell headers={["Order", "Customer", "Items", "Total", "Status", "Date", ""]}>
          {orders.map((o) => {
            let flagCount = 0;
            try {
              const f = JSON.parse(o.riskFlags || "[]");
              if (Array.isArray(f)) flagCount = f.length;
            } catch {
              flagCount = 0;
            }
            return (
            <tr key={o.id}>
              <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900">
                {o.orderNumber}
                {flagCount > 0 ? (
                  <span
                    title={`${flagCount} risk flag${flagCount === 1 ? "" : "s"} — see order detail`}
                    className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
                  >
                    ⚠ {flagCount}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-2.5">
                <p className="whitespace-nowrap font-medium text-gray-900">{o.fullName}</p>
                <p className="whitespace-nowrap text-xs text-gray-500">{o.mobile} · {o.city}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{o._count.items}</td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <Price value={o.total} className="font-semibold" />
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <StatusBadge status={o.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">
                {o.createdAt.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">
                <Link
                  href={`/admin/orders/${o.id}`}
                  title="View order"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  <IconEye className="h-3.5 w-3.5" /> View
                </Link>
              </td>
            </tr>
            );
          })}
        </TableShell>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/admin/orders" params={{ q, status, confirm, date }} />
    </div>
  );
}
