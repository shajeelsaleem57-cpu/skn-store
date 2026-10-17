import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { CategoryForm } from "../_components/CategoryForm";

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const [category, categories] = await Promise.all([
    prisma.category.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <Breadcrumbs items={[{ label: "Categories", href: "/admin/categories" }, { label: "Edit category" }]} />
      <PageHeader title="Edit category" subtitle={category.name} />
      <CategoryForm category={category} categories={categories} />
    </div>
  );
}
