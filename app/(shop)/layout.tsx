import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import MobileBottomNav from "@/components/MobileBottomNav";
import CartDrawer from "@/components/CartDrawer";

/** Storefront chrome: header, footer, WhatsApp float, mobile nav, cart drawer. */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
      {/* Spacer so the fixed mobile bottom nav never covers footer content */}
      <div className="no-print h-[68px] md:hidden" aria-hidden="true" />
      <WhatsAppFloat />
      <MobileBottomNav />
      <CartDrawer />
    </>
  );
}
