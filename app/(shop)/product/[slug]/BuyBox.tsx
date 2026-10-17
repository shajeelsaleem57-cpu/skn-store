"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/Toast";
import QuantitySelector from "@/components/QuantitySelector";
import Price from "@/components/Price";

import { effectivePrice, formatPKR, cn, buildWhatsAppLink } from "@/lib/utils";
import { IconCart, IconChat } from "@/components/Icons";

export type BuyBoxVariant = {
  id: string;
  name: string;
  value: string;
  priceAdjust: number;
};

export type BuyBoxProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string;
};

export default function BuyBox({
  product,
  variants,
  whatsappNumber,
  storeName,
}: {
  product: BuyBoxProduct;
  variants: BuyBoxVariant[];
  whatsappNumber: string;
  storeName: string;
}) {
  const { addItem, setOpen } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  // Group variants by option name, e.g. Size -> [S, M, L]
  const groups = useMemo(() => {
    const map = new Map<string, BuyBoxVariant[]>();
    for (const v of variants) {
      const list = map.get(v.name) ?? [];
      list.push(v);
      map.set(v.name, list);
    }
    return Array.from(map.entries());
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.map(([name, opts]) => [name, opts[0].id]))
  );
  const [qty, setQty] = useState(1);

  const chosenVariants = useMemo(
    () => groups.map(([name]) => variants.find((v) => v.id === selected[name])).filter(Boolean) as BuyBoxVariant[],
    [groups, selected, variants]
  );

  const priceAdjust = chosenVariants.reduce((sum, v) => sum + v.priceAdjust, 0);
  const unitPrice = effectivePrice(product.price, product.salePrice) + priceAdjust;
  const variantLabel = chosenVariants.map((v) => `${v.name}: ${v.value}`).join(", ");
  const inStock = product.stock > 0;

  const lineId = chosenVariants.length
    ? `${product.id}::${chosenVariants.map((v) => v.id).join(",")}`
    : product.id;

  const addToCart = () => {
    addItem({
      id: lineId,
      title: product.title,
      slug: product.slug,
      price: product.price + priceAdjust,
      salePrice: product.salePrice != null ? product.salePrice + priceAdjust : null,
      image: product.image,
      qty,
      variant: variantLabel || undefined,
    });
  };

  const handleAdd = () => {
    addToCart();
    toast("Added to cart");
    setOpen(true);
  };

  const handleBuyNow = () => {
    addToCart();
    router.push("/checkout");
  };

  const whatsappHref = buildWhatsAppLink(
    whatsappNumber,
    `Hello ${storeName}, I am interested in ${product.title}. Price: ${formatPKR(unitPrice)}.`
  );

  return (
    <div className="flex flex-col gap-5">
      <Price price={product.price + priceAdjust} salePrice={product.salePrice != null ? product.salePrice + priceAdjust : null} large />

      {groups.map(([name, opts]) => (
        <div key={name}>
          <p className="mb-2 text-sm font-semibold text-ink">
            {name}:{" "}
            <span className="font-normal text-muted">
              {opts.find((o) => o.id === selected[name])?.value}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [name]: o.id }))}
                aria-pressed={selected[name] === o.id}
                className={cn(
                  "rounded border px-4 py-2 text-sm font-medium transition",
                  selected[name] === o.id
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-ink hover:border-primary"
                )}
              >
                {o.value}
                {o.priceAdjust !== 0 ? (
                  <span className="ml-1 text-xs opacity-75">
                    ({o.priceAdjust > 0 ? "+" : ""}
                    {formatPKR(o.priceAdjust)})
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <QuantitySelector value={qty} onChange={setQty} min={1} max={Math.min(99, Math.max(1, product.stock))} />
        <p className={cn("text-sm font-medium", inStock ? "text-success" : "text-error")}>
          {inStock ? `In stock (${product.stock} available)` : "Out of stock"}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-soft-bg disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconCart /> Add to Cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!inStock}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded bg-success px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <IconChat /> Order on WhatsApp
      </a>
    </div>
  );
}
