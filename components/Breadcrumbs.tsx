import Link from "next/link";
import { Fragment } from "react";
import { IconChevronRight } from "./Icons";

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="no-print">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 && (
                <li aria-hidden="true">
                  <IconChevronRight className="h-3.5 w-3.5 text-muted" />
                </li>
              )}
              <li>
                {item.href && !last ? (
                  <Link
                    href={item.href}
                    className="text-muted transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={last ? "font-medium text-ink" : "text-muted"}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
