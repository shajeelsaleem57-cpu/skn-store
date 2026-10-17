import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  Breadcrumbs,
  EmptyState,
  PageHeader,
  Pagination,
  Pill,
  Stars,
  TableShell,
} from "../_components/ui";
import { ReviewActions } from "./_components/ReviewActions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function param(sp: { [k: string]: string | string[] | undefined }, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

const FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "featured", label: "Featured" },
  { value: "all", label: "All" },
] as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Math.max(1, parseInt(param(searchParams, "page") || "1", 10) || 1);
  const filter = param(searchParams, "filter") || "pending";

  const where: Prisma.ReviewWhereInput = {};
  if (filter === "pending") where.isApproved = false;
  else if (filter === "approved") where.isApproved = true;
  else if (filter === "featured") where.isFeatured = true;

  const [total, pendingCount, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.findMany({
      where,
      orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { product: { select: { id: true, title: true } } },
    }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Reviews" }]} />
      <PageHeader
        title="Reviews"
        subtitle={pendingCount > 0 ? `${pendingCount} awaiting moderation` : "All caught up"}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/reviews?filter=${f.value}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium",
              filter === f.value
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            {f.label}
            {f.value === "pending" && pendingCount > 0 ? ` (${pendingCount})` : null}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <EmptyState title="No reviews here" message="New customer reviews will appear for moderation." />
      ) : (
        <TableShell headers={["Review", "Product", "Rating", "Status", "Actions"]}>
          {reviews.map((r) => (
            <tr key={r.id}>
              <td className="max-w-md px-4 py-2.5">
                <p className="font-medium text-gray-900">
                  {r.name}
                  {r.isVerified ? <span className="ml-1.5 text-xs font-normal text-green-700">(verified buyer)</span> : null}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-600">{r.text}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {r.createdAt.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </td>
              <td className="px-4 py-2.5">
                <Link href={`/admin/products/${r.product.id}`} className="text-sm text-gray-700 hover:underline">
                  {r.product.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <Stars rating={r.rating} />
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <div className="flex flex-col items-start gap-1">
                  {r.isApproved ? <Pill tone="green">Approved</Pill> : <Pill tone="amber">Pending</Pill>}
                  {r.isFeatured ? <Pill tone="gray">Featured</Pill> : null}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <ReviewActions id={r.id} isApproved={r.isApproved} isFeatured={r.isFeatured} />
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/admin/reviews" params={{ filter }} />
    </div>
  );
}
