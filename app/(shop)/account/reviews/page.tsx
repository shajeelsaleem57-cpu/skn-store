import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import Rating from "@/components/Rating";
import EmptyState from "@/components/EmptyState";
import { IconCheck } from "@/components/Icons";
import { getAccountUser } from "../_session";

export const metadata: Metadata = { title: "My Reviews" };

export default async function AccountReviewsPage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?callbackUrl=/account/reviews");

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { title: true, slug: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/account" },
          { label: "Reviews" },
        ]}
      />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink md:text-3xl">My Reviews</h1>

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Reviews you write on products will appear here."
          actionLabel="Browse products"
          actionHref="/shop"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded border border-border bg-card p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Link
                  href={`/product/${r.product.slug}`}
                  className="text-sm font-semibold text-ink hover:underline"
                >
                  {r.product.title}
                </Link>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    r.isApproved ? "bg-soft-bg text-success" : "bg-soft-bg text-muted"
                  }`}
                >
                  {r.isApproved ? "Approved" : "Pending approval"}
                </span>
              </div>
              <Rating value={r.rating} size={14} />
              <p className="mt-2 text-sm text-ink">{r.text}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                {new Date(r.createdAt).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {r.isVerified ? (
                  <span className="inline-flex items-center gap-1 font-medium text-success">
                    <IconCheck /> Verified buyer
                  </span>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
