import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSetting, getWhatsAppNumber } from "@/lib/settings";
import { parseImages, parseSpecs, cn } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";
import Rating from "@/components/Rating";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { IconCheck, IconChevronDown } from "@/components/Icons";
import SafeHtml from "../../SafeHtml";
import { toCardData } from "../../_helpers";
import ProductGallery from "./ProductGallery";
import BuyBox from "./BuyBox";
import ReviewForm from "./ReviewForm";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product || !product.isPublished) return { title: "Product not found" };
  const images = parseImages(product.images);
  const category = await prisma.category.findUnique({
    where: { id: product.categoryId || "" },
    select: { name: true },
  }).catch(() => null);
  const catName = category?.name || "Online Shopping";
  // Keyword-rich title: Product + Category + Pakistan + COD
  const seoTitle =
    product.seoTitle ||
    `${product.title} | Buy Online in Pakistan with Cash on Delivery`;
  const seoDescription =
    product.seoDescription ||
    `Buy ${product.title} online in Pakistan at Rs. ${product.price.toLocaleString()}. ${catName} with Cash on Delivery, 2-4 day nationwide delivery & 15-day returns. Shop now at SKN Store.`;
  // Canonical + OG URLs use the live domain. sknstore.online DNS is not
  // pointed at Vercel yet, so canonicals must not reference the parked domain.
  const siteUrl = await getSetting("site_url", "https://skn-store.vercel.app");
  const canonicalUrl = `${siteUrl}/product/${product.slug}`;
  return {
    title: seoTitle,
    description: seoDescription.slice(0, 160),
    keywords: [
      product.title,
      `${product.title} Pakistan`,
      `${catName} Pakistan`,
      "buy online Pakistan",
      "cash on delivery Pakistan",
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: product.title,
      description: (product.shortDescription || seoDescription).slice(0, 160),
      images: images.slice(0, 1).map((src) => ({
        url: src.startsWith("http") ? src : `${siteUrl}${src}`,
        alt: `${product.title} - Buy online in Pakistan`,
      })),
      type: "website",
      url: canonicalUrl,
      siteName: "SKN Store",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription.slice(0, 160),
    },
  };
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-muted transition group-open:rotate-180">
          <IconChevronDown />
        </span>
      </summary>
      <div className="border-t border-border p-4 text-sm text-muted">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      variants: true,
      category: true,
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!product || !product.isPublished) notFound();

  const [whatsappNumber, storeName, deliveryInfo, returnInfo] = await Promise.all([
    getWhatsAppNumber(),
    getSetting("store_name", "SKN Store"),
    getSetting("delivery_info", "2–4 working days across Pakistan"),
    getSetting("return_info", "15-day return service"),
  ]);

  const images = parseImages(product.images);
  const specs = parseSpecs(product.specifications);
  const specEntries = Object.entries(specs);

  const faqs = await prisma.faq.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });

  const related = product.categoryId
    ? await prisma.product.findMany({
        where: { isPublished: true, categoryId: product.categoryId, id: { not: product.id } },
        take: 8,
        orderBy: { soldCount: "desc" },
      })
    : [];

  const crumbs: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
  ];
  if (product.category) crumbs.push({ label: product.category.name, href: `/shop?category=${product.category.slug}` });
  crumbs.push({ label: product.title });

  const jsonLdProduct = {
    title: product.title,
    slug: product.slug,
    images,
    price: product.price,
    salePrice: product.salePrice,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    shortDescription: product.shortDescription,
    stock: product.stock,
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <ProductJsonLd product={jsonLdProduct} />
      <BreadcrumbJsonLd items={crumbs} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={images} title={product.title} />

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-ink md:text-3xl">{product.title}</h1>
          <div className="flex items-center gap-2">
            <Rating value={product.ratingAvg} count={product.ratingCount} />
            {product.sku ? <span className="text-xs text-muted">SKU: {product.sku}</span> : null}
          </div>
          {product.shortDescription ? (
            <p className="text-sm leading-relaxed text-muted">{product.shortDescription}</p>
          ) : null}

          <BuyBox
            product={{
              id: product.id,
              title: product.title,
              slug: product.slug,
              price: product.price,
              salePrice: product.salePrice,
              stock: product.stock,
              image: images[0] || "",
            }}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              value: v.value,
              priceAdjust: v.priceAdjust,
            }))}
            whatsappNumber={whatsappNumber}
            storeName={storeName}
          />

          <div className="flex flex-col gap-2 pt-2">
            <Accordion title="Delivery information">
              <p>We deliver {deliveryInfo}. Cash on Delivery is available nationwide — you pay when your order arrives.</p>
            </Accordion>
            <Accordion title="Returns & refunds">
              <p>{returnInfo}. Items must be unused and in original packaging. Contact us on WhatsApp to start a return.</p>
            </Accordion>
            {faqs.length > 0 ? (
              <Accordion title="Frequently asked questions">
                <div className="flex flex-col gap-3">
                  {faqs.map((f) => (
                    <div key={f.id}>
                      <p className="font-semibold text-ink">{f.question}</p>
                      <p className="mt-0.5">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </Accordion>
            ) : null}
          </div>
        </div>
      </div>

      {/* Full description + specifications */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {product.description ? (
          <div>
            <h2 className="mb-3 text-lg font-bold text-ink">Product description</h2>
            <SafeHtml
              html={product.description}
              className="space-y-3 text-sm leading-relaxed text-ink [&_p]:text-muted"
            />
          </div>
        ) : null}
        {specEntries.length > 0 ? (
          <div>
            <h2 className="mb-3 text-lg font-bold text-ink">Specifications</h2>
            <dl className="overflow-hidden rounded border border-border">
              {specEntries.map(([k, v], i) => (
                <div key={k} className={cn("grid grid-cols-2 gap-2 px-4 py-2.5 text-sm", i % 2 === 0 && "bg-soft-bg")}>
                  <dt className="font-medium text-ink">{k}</dt>
                  <dd className="text-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-bold text-ink">
          Customer reviews {product.ratingCount > 0 ? `(${product.ratingCount})` : ""}
        </h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {product.reviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="Be the first to share what you think about this product."
              />
            ) : (
              product.reviews.map((r) => (
                <div key={r.id} className="rounded border border-border bg-card p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <Rating value={r.rating} size={14} />
                    <span className="text-xs text-muted">
                      {new Date(r.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-ink">{r.text}</p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {r.name}
                    {r.isVerified ? (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-soft-bg px-2 py-0.5 text-xs font-medium text-success">
                        <IconCheck /> Verified buyer
                      </span>
                    ) : null}
                  </p>
                </div>
              ))
            )}
          </div>
          <div>
            <ReviewForm productId={product.id} />
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-ink">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={toCardData(p)} />
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
