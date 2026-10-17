import Link from "next/link";
import {
  getSetting,
  getWhatsAppNumber} from "@/lib/settings";
import { buildWhatsAppLink } from "@/lib/utils";
import { displayPakistaniMobile } from "@/lib/utils";
import { IconCash, IconChat } from "./Icons";

const SHOP_LINKS = [
  { label: "All Products", href: "/shop" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Best Sellers", href: "/shop?filter=best-sellers" },
  { label: "Sale & Deals", href: "/shop?filter=sale" },
];

const SERVICE_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "Track Your Order", href: "/track-order" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Return & Refund Policy", href: "/return-refund-policy" },
  { label: "FAQs", href: "/faq" },
];

const INFO_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
  { label: "Refund Policy", href: "/return-refund-policy" },
];

function FooterLinkList({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label + l.href}>
            <Link
              href={l.href}
              className="text-sm text-muted transition-colors hover:text-accent"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default async function SiteFooter() {
  const [
    storeName,
    about,
    whatsapp,
    facebook,
    instagram,
    tiktok,
    youtube,
  ] = await Promise.all([
    getSetting("store_name", "SKN Store"),
    getSetting(
      "footer_about",
      "Quality products delivered across Pakistan with cash on delivery."
    ),
    getWhatsAppNumber(),
    getSetting("facebook_url", ""),
    getSetting("instagram_url", ""),
    getSetting("tiktok_url", ""),
    getSetting("youtube_url", ""),
  ]);

  const socials = [
    { label: "Facebook", href: facebook, short: "f" },
    { label: "Instagram", href: instagram, short: "ig" },
    { label: "TikTok", href: tiktok, short: "tt" },
    { label: "YouTube", href: youtube, short: "yt" },
  ].filter((s) => s.href.trim().length > 0);

  const whatsappHref = buildWhatsAppLink(
    whatsapp,
    `Hello ${storeName}, I need help with my order.`
  );
  const year = new Date().getFullYear();

  return (
    <footer className="no-print border-t border-border bg-soft-bg">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <FooterLinkList title="Shop" links={SHOP_LINKS} />
        <FooterLinkList title="Customer Service" links={SERVICE_LINKS} />
        <FooterLinkList title="Information" links={INFO_LINKS} />

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink">
            About {storeName}
          </h3>
          <p className="text-sm leading-relaxed text-muted">{about}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${storeName} on ${s.label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-xs font-bold uppercase text-ink shadow-sm transition-colors hover:bg-accent hover:text-white"
                >
                  {s.short}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-muted sm:flex-row">
          <p>
            © {year} {storeName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">
              <IconCash className="h-4 w-4 text-success" />
              Cash on Delivery
            </span>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:text-accent"
            >
              <IconChat className="h-4 w-4" />
              WhatsApp: {displayPakistaniMobile(whatsapp)}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
