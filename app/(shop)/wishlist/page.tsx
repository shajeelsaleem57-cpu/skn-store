import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import WishlistGrid from "./WishlistGrid";

export const metadata: Metadata = { title: "My Wishlist" };

export default function WishlistPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink md:text-3xl">My Wishlist</h1>
      <WishlistGrid />
    </main>
  );
}
