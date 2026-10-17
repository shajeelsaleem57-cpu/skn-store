import { cn, discountPercent, formatPKR } from "@/lib/utils";

export default function Price({
  price,
  salePrice,
  className,
  large,
}: {
  price: number;
  salePrice?: number | null;
  className?: string;
  large?: boolean;
}) {
  const pct = discountPercent(price, salePrice ?? null);
  const onSale = salePrice != null && salePrice < price;

  if (onSale) {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
        <span className={cn("font-bold text-sale", large ? "text-2xl" : "text-lg")}>
          {formatPKR(salePrice)}
        </span>
        <span className={cn("text-muted line-through", large ? "text-base" : "text-sm")}>
          {formatPKR(price)}
        </span>
        {pct !== null && (
          <span className="rounded-full bg-sale/10 px-2 py-0.5 text-xs font-bold text-sale">
            -{pct}%
          </span>
        )}
      </div>
    );
  }

  return (
    <span className={cn("font-bold text-ink", large ? "text-2xl" : "text-lg", className)}>
      {formatPKR(price)}
    </span>
  );
}
