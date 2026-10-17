import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getSetting,
  getWhatsAppNumber} from "@/lib/settings";
import { buildWhatsAppLink } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import { displayPakistaniMobile } from "@/lib/utils";
import SearchBar from "./SearchBar";
import CartButton from "./CartButton";
import MobileMenu from "./MobileMenu";
import MarqueeBar from "./MarqueeBar";
import { IconHeart, IconUser, IconTruck, IconChat } from "./Icons";

function Wordmark({ storeName }: { storeName: string }) {
  const [first, ...rest] = storeName.split(" ");
  return (
    <Link
      href="/"
      aria-label={`${storeName} — home`}
      className="flex shrink-0 items-baseline gap-1.5"
    >
      <span className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
        {first}
      </span>
      {rest.length > 0 && (
        <span className="text-xl font-light uppercase tracking-[0.25em] text-muted sm:text-2xl">
          {rest.join(" ")}
        </span>
      )}
      <span className="ml-0.5 hidden h-2 w-2 rounded-full bg-accent sm:inline-block" />
    </Link>
  );
}

export default async function SiteHeader() {
  const [
    storeName,
    announcementVisible,
    announcementBar,
    announcementBg,
    announcementColor,
    announcementSize,
    announcementSpeed,
    deliveryText,
    returnText,
    whatsapp,
  ] = await Promise.all([
    getSetting("store_name", "SKN Store"),
    getSetting("announcement_visible", "true"),
    getSetting("announcement_bar", ""),
    getSetting("announcement_bg", ""),
    getSetting("announcement_color", ""),
    getSetting("announcement_size", "12"),
    getSetting("announcement_speed", "30"),
    getSetting("topbar_delivery_text", ""),
    getSetting("topbar_return_text", ""),
    getWhatsAppNumber(),
  ]);

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [wishlistCount, categories] = await Promise.all([
    userId
      ? prisma.wishlist.count({ where: { userId } })
      : Promise.resolve(0),
    prisma.category.findMany({
      where: { isVisible: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 12,
      select: { name: true, slug: true },
    }),
  ]);

  const showAnnouncement =
    announcementVisible === "true" && announcementBar.trim().length > 0;
  const whatsappHref = buildWhatsAppLink(
    whatsapp,
    `Hello ${storeName}, I need help with my order.`
  );

  return (
    <header className="no-print sticky top-0 z-40 bg-surface shadow-[0_1px_0_var(--color-border)]">
      {showAnnouncement && (
        <MarqueeBar
          messages={announcementBar.split("|")}
          bgColor={announcementBg.trim() || undefined}
          textColor={announcementColor.trim() || undefined}
          fontSize={parseInt(announcementSize, 10) || 12}
          speedSeconds={parseInt(announcementSpeed, 10) || 30}
        />
      )}

      {/* Utility bar */}
      <div className="hidden border-b border-border bg-soft-bg md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs text-muted">
          <div className="flex items-center gap-4">
            {deliveryText && (
              <span className="inline-flex items-center gap-1.5">
                <IconTruck className="h-3.5 w-3.5" />
                {deliveryText}
              </span>
            )}
            {returnText && (
              <Link
                href="/return-refund-policy"
                className="hover:text-ink hover:underline"
              >
                {returnText}
              </Link>
            )}
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-ink"
          >
            <IconChat className="h-3.5 w-3.5" />
            WhatsApp Support: {displayPakistaniMobile(whatsapp)}
          </a>
        </div>
      </div>

      {/* Main header row */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-4">
        <MobileMenu links={NAV_LINKS} categories={categories} />
        <Wordmark storeName={storeName} />

        <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex">
          <div className="w-full max-w-xl">
            <SearchBar />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <Link
            href={userId ? "/account" : "/login"}
            aria-label={userId ? "My account" : "Sign in"}
            className="hidden rounded-full p-2 text-ink transition-colors hover:bg-soft-bg sm:block"
          >
            <IconUser className="h-6 w-6" />
          </Link>
          <Link
            href="/wishlist"
            aria-label={
              wishlistCount > 0
                ? `Wishlist, ${wishlistCount} items`
                : "Wishlist"
            }
            className="relative hidden rounded-full p-2 text-ink transition-colors hover:bg-soft-bg sm:block"
          >
            <IconHeart className="h-6 w-6" />
            {wishlistCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold leading-none text-white"
              >
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <CartButton />
        </div>
      </div>

      {/* Mobile search row */}
      <div className="border-t border-border px-4 pb-3 pt-2 md:hidden">
        <SearchBar />
      </div>

      {/* Desktop nav */}
      <nav
        aria-label="Primary"
        className="hidden border-t border-border md:block"
      >
        <ul className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4">
          {NAV_LINKS.map((l) => (
            <li key={l.href + l.label}>
              <Link
                href={l.href}
                className="block whitespace-nowrap px-4 py-3 text-sm font-medium text-ink transition-colors hover:text-accent"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
