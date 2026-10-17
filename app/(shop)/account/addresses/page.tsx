import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getAccountUser } from "../_session";
import AddressesManager from "./AddressesManager";

export const metadata: Metadata = { title: "My Addresses" };

export default async function AccountAddressesPage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?callbackUrl=/account/addresses");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/account" },
          { label: "Addresses" },
        ]}
      />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink md:text-3xl">My Addresses</h1>
      <AddressesManager />
    </main>
  );
}
