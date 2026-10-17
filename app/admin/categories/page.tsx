import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs, EmptyState, PageHeader, btnPrimary } from "../_components/ui";
import { IconPlus } from "../_components/icons";
import { CategoryTree, type CategoryNode } from "./_components/CategoryTree";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Categories" }]} />
      <PageHeader
        title="Categories"
        subtitle={`${rows.length} categor${rows.length === 1 ? "y" : "ies"} — drag order with the arrows`}
        actions={
          <Link href="/admin/categories/new" className={btnPrimary}>
            <IconPlus className="h-4 w-4" /> Add Category
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No categories yet"
          message="Create your first category to organize products."
          action={
            <Link href="/admin/categories/new" className={btnPrimary}>
              <IconPlus className="h-4 w-4" /> Add Category
            </Link>
          }
        />
      ) : (
        <CategoryTree rows={rows as CategoryNode[]} />
      )}
    </div>
  );
}
