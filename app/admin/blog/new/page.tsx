import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { BlogForm } from "../_components/BlogForm";

export default function NewBlogPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Blog", href: "/admin/blog" }, { label: "New post" }]} />
      <PageHeader title="New post" />
      <BlogForm post={null} />
    </div>
  );
}
