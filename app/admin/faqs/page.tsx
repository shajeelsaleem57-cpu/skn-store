import { prisma } from "@/lib/prisma";
import { Breadcrumbs, PageHeader } from "../_components/ui";
import { FaqManager } from "./_components/FaqManager";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const faqs = await prisma.faq.findMany({ orderBy: [{ sortOrder: "asc" }, { question: "asc" }] });

  return (
    <div>
      <Breadcrumbs items={[{ label: "FAQs" }]} />
      <PageHeader title="FAQs" subtitle={`${faqs.length} entr${faqs.length === 1 ? "y" : "ies"}`} />
      <FaqManager faqs={faqs} />
    </div>
  );
}
