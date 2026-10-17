import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Breadcrumbs,
  EmptyState,
  PageHeader,
  Pill,
  TableShell,
  Thumb,
  btnPrimary,
} from "../_components/ui";
import { DeleteButton } from "../_components/client";
import { IconEdit, IconPlus } from "../_components/icons";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Blog" }]} />
      <PageHeader
        title="Blog"
        subtitle={`${posts.length} post${posts.length === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/blog/new" className={btnPrimary}>
            <IconPlus className="h-4 w-4" /> Add Post
          </Link>
        }
      />
      {posts.length === 0 ? (
        <EmptyState
          title="No blog posts yet"
          action={
            <Link href="/admin/blog/new" className={btnPrimary}>
              <IconPlus className="h-4 w-4" /> Add Post
            </Link>
          }
        />
      ) : (
        <TableShell headers={["Post", "Category", "Status", "Published", "Actions"]}>
          {posts.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Thumb src={p.image} alt={p.title} />
                  <div className="min-w-0">
                    <p className="max-w-[18rem] truncate font-medium text-gray-900">{p.title}</p>
                    <p className="font-mono text-xs text-gray-400">/{p.slug}</p>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{p.category ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-2.5">
                {p.isPublished ? <Pill tone="green">Published</Pill> : <Pill tone="gray">Draft</Pill>}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">
                {p.publishedAt
                  ? p.publishedAt.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <Link href={`/admin/blog/${p.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
                    <IconEdit className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <DeleteButton url={`/api/admin/blog/${p.id}`} confirmMessage={`Delete post "${p.title}"?`} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
