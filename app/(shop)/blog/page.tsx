import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <h1 className="mb-2 mt-2 text-2xl font-bold text-ink md:text-3xl">Blog</h1>
      <p className="mb-8 text-sm text-muted">
        Tips, guides and news from our store.
      </p>

      {posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="We are working on our first articles — check back soon."
          actionLabel="Back to home"
          actionHref="/"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded border border-border bg-card transition hover:shadow-md"
            >
              <div className="relative aspect-[16/9] w-full bg-soft-bg">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-5">
                {p.category ? (
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    {p.category}
                  </p>
                ) : null}
                <h2 className="text-base font-bold text-ink group-hover:underline">{p.title}</h2>
                {p.excerpt ? (
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{p.excerpt}</p>
                ) : null}
                <p className="mt-3 text-xs text-muted">
                  {p.author ? `${p.author} · ` : ""}
                  {p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
