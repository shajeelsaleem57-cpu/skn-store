import { getSetting } from "@/lib/settings";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://skn-store.vercel.app").replace(
    /\/$/,
    ""
  );
}

function Ld({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export async function OrganizationJsonLd() {
  const storeName = await getSetting("store_name", "SKN Store");
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: storeName,
        url: baseUrl(),
      }}
    />
  );
}

export async function WebSiteJsonLd() {
  const storeName = await getSetting("store_name", "SKN Store");
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: storeName,
        url: baseUrl(),
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl()}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export type ProductJsonLdData = {
  title: string;
  slug: string;
  images: string[];
  price: number;
  salePrice: number | null;
  ratingAvg: number;
  ratingCount: number;
  shortDescription: string | null;
  stock: number;
};

export function ProductJsonLd({ product }: { product: ProductJsonLdData }) {
  const effective = product.salePrice != null && product.salePrice < product.price
    ? product.salePrice
    : product.price;
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        image: product.images,
        description: product.shortDescription ?? undefined,
        brand: { "@type": "Brand", name: "SKN Store" },
        offers: {
          "@type": "Offer",
          url: `${baseUrl()}/product/${product.slug}`,
          priceCurrency: "PKR",
          price: effective,
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: "SKN Store",
            url: baseUrl(),
          },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: "250",
              currency: "PKR",
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "PK",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: {
                "@type": "QuantitativeValue",
                minValue: 1,
                maxValue: 2,
                unitCode: "DAY",
              },
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: 2,
                maxValue: 4,
                unitCode: "DAY",
              },
            },
          },
        },
        ...(product.ratingCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.ratingAvg,
                reviewCount: product.ratingCount,
              },
            }
          : {}),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.label,
          ...(item.href ? { item: `${baseUrl()}${item.href}` } : {}),
        })),
      }}
    />
  );
}

export function FaqJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }}
    />
  );
}
