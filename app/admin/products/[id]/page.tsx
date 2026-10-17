import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { ProductForm, type CategoryOption } from "../_components/ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parent: { select: { name: true } } },
    }),
  ]);

  if (!product) notFound();

  const options: CategoryOption[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentName: c.parent?.name ?? null,
  }));

  return (
    <div>
      <Breadcrumbs items={[{ label: "Products", href: "/admin/products" }, { label: "Edit product" }]} />
      <PageHeader title="Edit product" subtitle={product.title} />
      <ProductForm product={product} categories={options} />
    </div>
  );
}
