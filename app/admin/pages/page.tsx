import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Breadcrumbs,
  EmptyState,
  PageHeader,
  Pill,
  TableShell,
  btnPrimary,
} from "../_components/ui";
import { DeleteButton } from "../_components/client";
import { IconEdit, IconPlus } from "../_components/icons";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Pages" }]} />
      <PageHeader
        title="Pages"
        subtitle="Static content pages (about, shipping info, etc.)"
        actions={
          <Link href="/admin/pages/new" className={btnPrimary}>
            <IconPlus className="h-4 w-4" /> Add Page
          </Link>
        }
      />
      {pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          action={
            <Link href="/admin/pages/new" className={btnPrimary}>
              <IconPlus className="h-4 w-4" /> Add Page
            </Link>
          }
        />
      ) : (
        <TableShell headers={["Title", "Slug", "Status", "Updated", "Actions"]}>
          {pages.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-2.5 font-medium text-gray-900">{p.title}</td>
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-gray-500">/{p.slug}</td>
              <td className="whitespace-nowrap px-4 py-2.5">
                {p.isPublished ? <Pill tone="green">Published</Pill> : <Pill tone="gray">Draft</Pill>}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">
                {p.updatedAt.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <Link href={`/admin/pages/${p.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
                    <IconEdit className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <DeleteButton url={`/api/admin/pages/${p.id}`} confirmMessage={`Delete page "${p.title}"?`} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
