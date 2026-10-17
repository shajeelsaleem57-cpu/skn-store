import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { PageForm } from "../_components/PageForm";

export default async function EditPagePage({ params }: { params: { id: string } }) {
  const page = await prisma.page.findUnique({ where: { id: params.id } });
  if (!page) notFound();

  return (
    <div>
      <Breadcrumbs items={[{ label: "Pages", href: "/admin/pages" }, { label: "Edit page" }]} />
      <PageHeader title="Edit page" subtitle={page.title} />
      <PageForm page={page} />
    </div>
  );
}
