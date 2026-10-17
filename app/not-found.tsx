import Link from "next/link";
import { IconAlert } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-bg text-muted">
        <IconAlert className="h-8 w-8" />
      </span>
      <h1 className="text-3xl font-extrabold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Go Home
        </Link>
        <Link
          href="/shop"
          className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-soft-bg"
        >
          Shop Products
        </Link>
      </div>
    </div>
  );
}
