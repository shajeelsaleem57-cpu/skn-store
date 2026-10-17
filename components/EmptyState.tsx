import Link from "next/link";
import type { ReactNode } from "react";
import { IconBox } from "./Icons";

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-bg text-muted">
        {icon ?? <IconBox className="h-8 w-8" />}
      </span>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description && (
        <p className="max-w-sm text-sm text-muted">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
