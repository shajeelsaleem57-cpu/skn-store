import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import SafeHtml from "../../SafeHtml";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || !post.isPublished) return { title: "Post not found" };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.image ? [post.image] : [],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || !post.isPublished) notFound();

  const related = post.category
    ? await prisma.blogPost.findMany({
        where: { isPublished: true, category: post.category, id: { not: post.id } },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 3,
      })
    : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />

      {post.category ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
          {post.category}
        </p>
      ) : null}
      <h1 className="mt-1 text-2xl font-bold text-ink md:text-4xl">{post.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {post.author ? `By ${post.author} · ` : ""}
        {post.publishedAt
          ? new Date(post.publishedAt).toLocaleDateString("en-PK", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : ""}
      </p>

      {post.image ? (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded bg-soft-bg">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 896px"
          />
        </div>
      ) : null}

      <SafeHtml
        html={post.content}
        className="mt-8 space-y-4 text-sm leading-relaxed text-ink md:text-base [&_p]:text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_img]:rounded"
      />

      {related.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-ink">Related posts</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="group overflow-hidden rounded border border-border bg-card transition hover:shadow-md"
              >
                {r.image ? (
                  <div className="relative aspect-[16/9] w-full bg-soft-bg">
                    <Image
                      src={r.image}
                      alt={r.title}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-bold text-ink group-hover:underline">
                    {r.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
