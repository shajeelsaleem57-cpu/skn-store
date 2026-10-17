"use client";

import { IconAlert } from "@/components/Icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
        <IconAlert className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-extrabold text-ink">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted">
        We ran into an unexpected problem. Please try again in a moment.
      </p>
      {error?.digest && (
        <p className="text-xs text-muted">Error ID: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Try Again
      </button>
    </div>
  );
}
