import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getSetting } from "@/lib/settings";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Coupons", href: "/admin/coupons" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Homepage", href: "/admin/homepage" },
  { label: "Appearance", href: "/admin/appearance" },
  { label: "Pages", href: "/admin/pages" },
  { label: "Blog", href: "/admin/blog" },
  { label: "FAQs", href: "/admin/faqs" },
  { label: "Settings", href: "/admin/settings" },
  { label: "View Store", href: "/" },
];

export const metadata = { title: "Admin — SKN Store" };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "admin") {
    redirect("/login?callbackUrl=%2Fadmin&admin=1");
  }

  let storeName = "SKN Store";
  try {
    storeName = await getSetting("store_name", "SKN Store");
  } catch {
    // fall back
  }
  const email = session.user.email ?? "";

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <nav className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col border-r border-gray-200 bg-white p-4 md:flex">
        <p className="mb-6 px-2 text-lg font-bold text-gray-900">{storeName}</p>
        <p className="mb-4 truncate px-2 text-xs text-gray-500">{email}</p>
        <div className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <form action="/api/auth/signout" method="post" className="mt-auto">
          <button
            type="submit"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </form>
      </nav>
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-gray-200 bg-white px-6 py-3 md:flex">
          <p className="text-sm font-semibold text-gray-900">{storeName} — Admin Panel</p>
          <span className="max-w-[14rem] truncate text-sm text-gray-500">{email}</span>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
