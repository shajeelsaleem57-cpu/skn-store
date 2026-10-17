import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/utils";
import {
  Breadcrumbs,
  EmptyState,
  PageHeader,
  Pagination,
  Pill,
  Price,
  TableShell,
  Thumb,
  btnPrimary,
  inputCls,
} from "../_components/ui";
import { DeleteButton } from "../_components/client";
import { IconEdit, IconPlus, IconSearch } from "../_components/icons";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function param(sp: { [k: string]: string | string[] | undefined }, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Math.max(1, parseInt(param(searchParams, "page") || "1", 10) || 1);
  const q = param(searchParams, "q").trim();
  const category = param(searchParams, "category");
  const status = param(searchParams, "status");

  const where: Prisma.ProductWhereInput = {};
  if (q) where.OR = [{ title: { contains: q } }, { sku: { contains: q } }];
  if (category) where.categoryId = category;
  if (status === "published") where.isPublished = true;
  if (status === "draft") where.isPublished = false;

  const [total, products, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Products" }]} />
      <PageHeader
        title="Products"
        subtitle={`${total} product${total === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/products/new" className={btnPrimary}>
            <IconPlus className="h-4 w-4" /> Add Product
          </Link>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="min-w-[13rem] flex-1">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input name="q" defaultValue={q} placeholder="Search title or SKU…" className={`${inputCls} pl-9`} />
          </div>
        </div>
        <select name="category" defaultValue={category} className={inputCls + " w-auto"}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} className={inputCls + " w-auto"}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button type="submit" className={btnPrimary}>
          Filter
        </button>
        {q || category || status ? (
          <Link href="/admin/products" className="text-sm text-gray-500 hover:underline">
            Clear
          </Link>
        ) : null}
      </form>

      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          message="Try adjusting your filters, or add your first product."
          action={
            <Link href="/admin/products/new" className={btnPrimary}>
              <IconPlus className="h-4 w-4" /> Add Product
            </Link>
          }
        />
      ) : (
        <TableShell headers={["Product", "Category", "Price", "Stock", "Status", "Actions"]}>
          {products.map((p) => {
            const img = parseImages(p.images)[0];
            const low = p.stock <= p.lowStockThreshold;
            return (
              <tr key={p.id}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Thumb src={img} alt={p.title} />
                    <div className="min-w-0">
                      <p className="max-w-[16rem] truncate font-medium text-gray-900">{p.title}</p>
                      <p className="text-xs text-gray-500">{p.sku || p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{p.category?.name ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  {p.salePrice && p.salePrice < p.price ? (
                    <span>
                      <Price value={p.salePrice} className="font-semibold text-red-600" />{" "}
                      <Price value={p.price} className="text-xs text-gray-400 line-through" />
                    </span>
                  ) : (
                    <Price value={p.price} className="font-medium" />
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className={low ? "font-bold text-red-600" : "text-gray-700"}>{p.stock}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  {p.isPublished ? <Pill tone="green">Published</Pill> : <Pill tone="gray">Draft</Pill>}
                  {p.isFeatured ? <Pill tone="amber">Featured</Pill> : null}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/products/${p.id}`}
                      title="Edit"
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      <IconEdit className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <DeleteButton url={`/api/admin/products/${p.id}`} confirmMessage={`Delete "${p.title}"? This cannot be undone.`} />
                  </div>
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/admin/products" params={{ q, category, status }} />
    </div>
  );
}
