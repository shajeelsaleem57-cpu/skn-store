import { prisma } from "@/lib/prisma";
import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { CategoryForm } from "../_components/CategoryForm";

export default async function NewCategoryPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, parentId: true },
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Categories", href: "/admin/categories" }, { label: "New category" }]} />
      <PageHeader title="New category" />
      <CategoryForm category={null} categories={categories} />
    </div>
  );
}
