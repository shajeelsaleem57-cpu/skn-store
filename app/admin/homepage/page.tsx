import { prisma } from "@/lib/prisma";
import { Breadcrumbs, EmptyState, PageHeader } from "../_components/ui";
import { HomepageManager } from "./_components/HomepageManager";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const [sections, products] = await Promise.all([
    prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { isPublished: true },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
      take: 500,
    }),
  ]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Homepage" }]} />
      <PageHeader
        title="Homepage"
        subtitle="Control which sections appear on the store homepage and in what order."
      />
      {sections.length === 0 ? (
        <EmptyState
          title="No homepage sections"
          message="Sections are created by the storefront seed. Run the seed script to populate them."
        />
      ) : (
        <HomepageManager sections={sections} products={products} />
      )}
    </div>
  );
}
