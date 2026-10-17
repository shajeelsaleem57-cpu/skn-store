import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { BlogForm } from "../_components/BlogForm";

export default async function EditBlogPage({ params }: { params: { id: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!post) notFound();

  return (
    <div>
      <Breadcrumbs items={[{ label: "Blog", href: "/admin/blog" }, { label: "Edit post" }]} />
      <PageHeader title="Edit post" subtitle={post.title} />
      <BlogForm post={post} />
    </div>
  );
}
