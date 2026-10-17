import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/utils";
import {
  Breadcrumbs,
  EmptyState,
  PageHeader,
  Pill,
  TableShell,
  btnPrimary,
} from "../_components/ui";
import { DeleteButton } from "../_components/client";
import { IconEdit, IconPlus } from "../_components/icons";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Coupons" }]} />
      <PageHeader
        title="Coupons"
        subtitle={`${coupons.length} coupon${coupons.length === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/coupons/new" className={btnPrimary}>
            <IconPlus className="h-4 w-4" /> Add Coupon
          </Link>
        }
      />

      {coupons.length === 0 ? (
        <EmptyState
          title="No coupons yet"
          message="Create discount codes for promotions and campaigns."
          action={
            <Link href="/admin/coupons/new" className={btnPrimary}>
              <IconPlus className="h-4 w-4" /> Add Coupon
            </Link>
          }
        />
      ) : (
        <TableShell headers={["Code", "Discount", "Min order", "Used", "Expires", "Status", "Actions"]}>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td className="whitespace-nowrap px-4 py-2.5 font-mono font-semibold text-gray-900">{c.code}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">
                {c.type === "PERCENT" ? `${c.value}%` : formatPKR(c.value)}
                {c.maxDiscount ? <span className="text-xs text-gray-400"> (max {formatPKR(c.maxDiscount)})</span> : null}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">
                {c.minOrder ? formatPKR(c.minOrder) : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">
                {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">
                {c.expiresAt
                  ? c.expiresAt.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                  : "Never"}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                {c.isActive ? <Pill tone="green">Active</Pill> : <Pill tone="gray">Inactive</Pill>}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/coupons/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <IconEdit className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <DeleteButton url={`/api/admin/coupons/${c.id}`} confirmMessage={`Delete coupon "${c.code}"?`} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
