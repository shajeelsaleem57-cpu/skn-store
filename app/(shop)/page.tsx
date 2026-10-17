import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 1800;
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { parseImages, formatPKR, discountPercent } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import Rating from "@/components/Rating";
import Price from "@/components/Price";
import Countdown from "@/components/Countdown";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/JsonLd";
import {
  IconTruck,
  IconCash,
  IconShield,
  IconPackage,
  IconChat,
  IconCheck,
  IconArrowRight,
} from "@/components/Icons";
import { toCardData, parseConfig } from "./_helpers";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [title, description, siteUrl] = await Promise.all([
    getSetting("meta_title", "SKN Store — Online Shopping in Pakistan | Cash on Delivery"),
    getSetting(
      "meta_description",
      "Shop 200+ quality products online in Pakistan — mobile accessories, kitchen gadgets, household essentials & beauty products. Cash on Delivery, 2-4 day nationwide delivery, 15-day returns."
    ),
    getSetting("site_url", "https://skn-store.vercel.app"),
  ]);
  const keywords = [
    "online shopping Pakistan",
    "buy online Pakistan",
    "cash on delivery Pakistan",
    "online store Pakistan",
    "mobile accessories Pakistan",
    "kitchen gadgets Pakistan",
    "household products Pakistan",
    "beauty products Pakistan",
    "SKN Store",
  ];
  return {
    // absolute: the admin's meta_title is the complete title — the layout
    // template would otherwise append "| SKN Store" a second time
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: siteUrl },
    openGraph: {
      title,
      description,
      url: siteUrl,
      type: "website",
      siteName: "SKN Store",
      images: [
        {
          url: `${siteUrl}/images/hero-storefront.jpg`,
          alt: "SKN Store — Online Shopping in Pakistan",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

type HeroConfig = {
  heading: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  image: string;
  background: string;
  alignment: string;
};

type TrustItem = { title: string; text?: string };
type WhyItem = { title: string; text?: string };

const TRUST_ICONS = [IconTruck, IconCash, IconShield, IconPackage, IconChat];

function HeroSection({ config }: { config: HeroConfig }) {
  const align =
    config.alignment === "center"
      ? "text-center items-center"
      : config.alignment === "right"
        ? "text-right items-end"
        : "text-left items-start";
  // Use professional storefront image instead of placeholder URLs
  const heroImage = config.image?.includes("picsum.photos")
    ? "/images/hero-storefront.jpg"
    : config.image || "/images/hero-storefront.jpg";
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #FAF7F2 0%, #F3EDE4 50%, #EDE6D8 100%)",
      }}
    >
      {/* subtle decorative blobs */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "#E8B04B" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "#2D5A3D" }}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-14 md:py-24 lg:flex-row lg:items-center lg:gap-14">
        <div className={`flex flex-1 flex-col gap-6 ${align}`}>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Pakistan&apos;s Trusted Online Store
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-ink md:text-6xl">
            {config.heading}
          </h1>
          {config.description ? (
            <p className="max-w-xl text-base leading-relaxed text-muted md:text-xl">
              {config.description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-4 pt-1">
            {config.ctaText ? (
              <Link
                href={config.ctaUrl || "/shop"}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                {config.ctaText}
                <IconArrowRight />
              </Link>
            ) : null}
            {config.secondaryCtaText ? (
              <Link
                href={config.secondaryCtaUrl || "/categories"}
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-white/80 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-ink backdrop-blur transition hover:border-ink/40"
              >
                {config.secondaryCtaText}
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <IconCheck /> Cash on Delivery
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconCheck /> 2–4 Day Delivery
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconCheck /> 15-Day Returns
            </span>
          </div>
        </div>
        <div className="relative w-full flex-1">
          <div className="relative h-64 w-full overflow-hidden rounded-3xl shadow-2xl md:h-96 lg:h-[28rem]">
            <Image
              src={heroImage}
              alt={config.heading}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {/* floating accent card */}
          <div className="absolute -bottom-5 left-6 hidden rounded-2xl bg-white/95 px-5 py-3.5 shadow-xl backdrop-blur md:block">
            <p className="text-2xl font-extrabold text-ink">202+</p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Products in Store
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStripSection({ items }: { items: TrustItem[] }) {
  return (
    <section className="border-b border-border bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-3 lg:grid-cols-5">
        {items.slice(0, 5).map((item, i) => {
          const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft-bg text-primary">
                <Icon />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                {item.text ? <p className="text-xs text-muted">{item.text}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function CategoriesSection({ heading, limit }: { heading: string; limit: number }) {
  const categories = await prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: limit,
  });
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink md:text-2xl">{heading}</h2>
        <Link href="/categories" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          View all <IconArrowRight />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}`}
            className="group overflow-hidden rounded border border-border bg-card transition hover:shadow-md"
          >
            <div className="relative aspect-[4/3] w-full bg-soft-bg">
              {c.image ? (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  loading="lazy"
                  quality={60}
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : null}
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-semibold text-ink group-hover:underline">{c.name}</p>
              {c.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function BestSellersSection({ heading, limit }: { heading: string; limit: number }) {
  const products = await prisma.product.findMany({
    where: { isPublished: true, isBestSeller: true },
    orderBy: { soldCount: "desc" },
    take: limit,
  });
  if (products.length === 0) return null;
  return (
    <section className="bg-soft-bg">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink md:text-2xl">{heading}</h2>
          <Link href="/shop?filter=best-sellers" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            View all <IconArrowRight />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={toCardData(p)} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function FlashDealSection({
  config,
}: {
  config: {
    heading: string;
    description: string;
    productSlug: string;
    countdownEnabled: boolean;
    endsAt: string;
    ctaText: string;
  };
}) {
  // Never show fake urgency: render only when the countdown is enabled,
  // the end date is in the future, and the product actually exists.
  if (!config.countdownEnabled || !config.endsAt || !config.productSlug) return null;
  const endsAtDate = new Date(config.endsAt);
  if (Number.isNaN(endsAtDate.getTime()) || endsAtDate <= new Date()) return null;
  const product = await prisma.product.findFirst({
    where: { slug: config.productSlug, isPublished: true },
  });
  if (!product) return null;
  const images = parseImages(product.images);
  const pct = discountPercent(product.price, product.salePrice);
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-col gap-6 overflow-hidden rounded border border-border bg-card p-6 md:flex-row md:items-center md:p-10">
        {images[0] ? (
          <Link href={`/product/${product.slug}`} className="relative mx-auto h-56 w-full max-w-xs shrink-0 md:mx-0 md:h-64">
            <Image
              src={images[0]}
              alt={product.title}
              fill
              loading="lazy"
              quality={60}
              className="rounded object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </Link>
        ) : null}
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-sale">{config.heading || "Flash Deal"}</p>
          <h2 className="text-xl font-bold text-ink md:text-2xl">
            <Link href={`/product/${product.slug}`} className="hover:underline">
              {product.title}
            </Link>
          </h2>
          {config.description ? <p className="text-sm text-muted">{config.description}</p> : null}
          <div className="flex items-center gap-3">
            <Price price={product.price} salePrice={product.salePrice} large />
            {pct ? (
              <span className="rounded bg-sale px-2 py-1 text-xs font-bold text-white">
                {pct}% OFF
              </span>
            ) : null}
          </div>
          <Countdown endsAt={endsAtDate.toISOString()} />
          <div>
            <Link
              href={`/product/${product.slug}`}
              className="inline-flex items-center gap-2 rounded bg-sale px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {config.ctaText || "Grab the Deal"}
              <IconArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyUsSection({ heading, items }: { heading: string; items: WhyItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="mb-6 text-xl font-bold text-ink md:text-2xl">{heading}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 rounded border border-border bg-card p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-bg text-success">
              <IconCheck />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              {item.text ? <p className="mt-1 text-sm text-muted">{item.text}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function ReviewsSection({ heading, limit }: { heading: string; limit: number }) {
  const reviews = await prisma.review.findMany({
    where: { isApproved: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { product: { select: { title: true, slug: true } } },
  });
  if (reviews.length === 0) return null;
  return (
    <section className="bg-soft-bg">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-xl font-bold text-ink md:text-2xl">{heading}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded border border-border bg-card p-5">
              <Rating value={r.rating} size={16} />
              <p className="flex-1 text-sm text-ink line-clamp-4">{r.text}</p>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {r.name}
                  {r.isVerified ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-soft-bg px-2 py-0.5 text-xs font-medium text-success">
                      <IconCheck /> Verified buyer
                    </span>
                  ) : null}
                </p>
                <Link
                  href={`/product/${r.product.slug}`}
                  className="text-xs text-muted hover:underline"
                >
                  on {r.product.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const sections = await prisma.homepageSection.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      {sections.map((s) => {
        switch (s.type) {
          case "hero": {
            const c = parseConfig<HeroConfig>(s.config, {
              heading: "",
              description: "",
              ctaText: "",
              ctaUrl: "/shop",
              secondaryCtaText: "",
              secondaryCtaUrl: "/categories",
              image: "",
              background: "#F7F7F7",
              alignment: "left",
            });
            return <HeroSection key={s.id} config={c} />;
          }
          case "trust_strip": {
            const c = parseConfig<{ items: TrustItem[] }>(s.config, { items: [] });
            return <TrustStripSection key={s.id} items={c.items} />;
          }
          case "categories": {
            const c = parseConfig(s.config, { heading: "Shop by Category", limit: 5 });
            return (
              <CategoriesSection
                key={s.id}
                heading={String(c.heading)}
                limit={Number(c.limit) || 5}
              />
            );
          }
          case "best_sellers": {
            const c = parseConfig(s.config, { heading: "Best Sellers", limit: 8 });
            return (
              <BestSellersSection
                key={s.id}
                heading={String(c.heading)}
                limit={Number(c.limit) || 8}
              />
            );
          }
          case "flash_deal": {
            const c = parseConfig(s.config, {
              heading: "Flash Deal",
              description: "",
              productSlug: "",
              countdownEnabled: false,
              endsAt: "",
              ctaText: "Grab the Deal",
            });
            return (
              <FlashDealSection
                key={s.id}
                config={{
                  heading: String(c.heading),
                  description: String(c.description),
                  productSlug: String(c.productSlug),
                  countdownEnabled: Boolean(c.countdownEnabled),
                  endsAt: String(c.endsAt),
                  ctaText: String(c.ctaText),
                }}
              />
            );
          }
          case "why_us": {
            const c = parseConfig<{ heading: string; items: WhyItem[] }>(s.config, {
              heading: "Why Shop With Us?",
              items: [],
            });
            return <WhyUsSection key={s.id} heading={c.heading} items={c.items} />;
          }
          case "reviews": {
            const c = parseConfig(s.config, { heading: "What Customers Say", limit: 6 });
            return (
              <ReviewsSection
                key={s.id}
                heading={String(c.heading)}
                limit={Number(c.limit) || 6}
              />
            );
          }
          default:
            return null;
        }
      })}
    </main>
  );
}
