export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card" aria-hidden="true">
      <div className="skeleton aspect-square !rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-5 w-1/2" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-8 flex-1" />
          <div className="skeleton h-8 flex-1" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8" aria-hidden="true">
      <div className="skeleton h-5 w-48" />
      <div className="skeleton h-10 w-72" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="skeleton aspect-video" />
        <div className="space-y-3">
          <div className="skeleton h-6 w-full" />
          <div className="skeleton h-6 w-5/6" />
          <div className="skeleton h-6 w-2/3" />
        </div>
      </div>
      <ProductGridSkeleton count={4} />
    </div>
  );
}
