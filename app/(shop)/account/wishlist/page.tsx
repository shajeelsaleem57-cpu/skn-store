import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getAccountUser } from "../_session";
import WishlistGrid from "../../wishlist/WishlistGrid";

export const metadata: Metadata = { title: "My Wishlist" };

export default async function AccountWishlistPage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?callbackUrl=/account/wishlist");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/account" },
          { label: "Wishlist" },
        ]}
      />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink md:text-3xl">My Wishlist</h1>
      <WishlistGrid />
    </main>
  );
}
