import { prisma } from "@/lib/prisma";
import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { ProductForm, type CategoryOption } from "../_components/ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, parent: { select: { name: true } } },
  });
  const options: CategoryOption[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentName: c.parent?.name ?? null,
  }));

  return (
    <div>
      <Breadcrumbs items={[{ label: "Products", href: "/admin/products" }, { label: "New product" }]} />
      <PageHeader title="New product" />
      <ProductForm product={null} categories={options} />
    </div>
  );
}
