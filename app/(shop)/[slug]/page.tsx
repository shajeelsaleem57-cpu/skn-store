import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import { FaqJsonLd } from "@/components/JsonLd";
import SafeHtml from "../SafeHtml";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  if (!page || !page.isPublished) return { title: "Page not found" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function ContentPage({ params }: { params: { slug: string } }) {
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  if (!page || !page.isPublished) notFound();

  const isFaq = params.slug === "faq";
  const faqs = isFaq
    ? await prisma.faq.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {isFaq ? (
        <FaqJsonLd faqs={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
      ) : null}
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: page.title }]} />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink md:text-3xl">{page.title}</h1>

      {page.content ? (
        <SafeHtml
          html={page.content}
          className="space-y-4 text-sm leading-relaxed text-ink [&_p]:text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold"
        />
      ) : null}

      {isFaq && faqs.length > 0 ? (
        <div className="mt-8 flex flex-col gap-3">
          {faqs.map((f) => (
            <details key={f.id} className="rounded border border-border bg-card">
              <summary className="cursor-pointer list-none p-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.question}
              </summary>
              <div className="border-t border-border p-4 text-sm text-muted">{f.answer}</div>
            </details>
          ))}
        </div>
      ) : null}
    </main>
  );
}
