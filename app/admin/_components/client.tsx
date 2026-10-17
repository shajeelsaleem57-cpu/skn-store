"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { IconLogout, IconMenu, IconTrash, IconX } from "./icons";
import { useToast } from "./toast";
import { cn } from "@/lib/utils";

export type NavEntry = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  external?: boolean;
};

/* ---------- sidebar / mobile nav ---------- */
export function AdminNav({
  items,
  storeName,
  email,
}: {
  items: NavEntry[];
  storeName: string;
  email: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive(href) ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
    );

  const links = (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const cls = linkCls(item.href);
        return item.external ? (
          <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={cls}>
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </a>
        ) : (
          <Link key={item.label} href={item.href} className={cls} onClick={() => setOpen(false)}>
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
      <LogoutButton className="mt-1 w-full justify-start" />
    </>
  );

  return (
    <>
      {/* desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-gray-900 md:flex">
        <div className="border-b border-gray-800 px-4 py-4">
          <p className="truncate text-base font-bold text-white">{storeName}</p>
          <p className="truncate text-xs text-gray-400">Admin Panel</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{links}</nav>
        <div className="border-t border-gray-800 px-4 py-3">
          <p className="truncate text-xs text-gray-400">{email}</p>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="no-print sticky top-0 z-40 flex items-center justify-between bg-gray-900 px-4 py-3 text-white md:hidden">
        <span className="truncate text-sm font-bold">{storeName} — Admin</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1.5 hover:bg-gray-800"
          aria-label="Toggle menu"
        >
          {open ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <nav className="no-print sticky top-[52px] z-30 space-y-1 border-b border-gray-800 bg-gray-900 px-3 py-3 md:hidden">
          {links}
        </nav>
      ) : null}
    </>
  );
}

/* ---------- logout ---------- */
export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white",
        className
      )}
    >
      <IconLogout className="h-4 w-4 shrink-0" />
      Logout
    </button>
  );
}

/* ---------- delete with confirm ---------- */
export function DeleteButton({
  url,
  confirmMessage = "Are you sure? This cannot be undone.",
  title = "Delete",
  className,
}: {
  url: string;
  confirmMessage?: string;
  title?: string;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!window.confirm(confirmMessage)) return;
    setBusy(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast("Deleted successfully");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50",
        className
      )}
    >
      <IconTrash className="h-3.5 w-3.5" />
      {busy ? "Deleting…" : title}
    </button>
  );
}

/* ---------- print ---------- */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

/* ---------- toggle switch ---------- */
export function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-gray-900" : "bg-gray-300"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
