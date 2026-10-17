"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { useToast } from "./Toast";
import Rating from "./Rating";
import Price from "./Price";
import { IconHeart, IconHeartFilled, IconEye } from "./Icons";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  stock: number;
};

const LOW_STOCK_AT = 5;

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const out = product.stock <= 0;
  const low = !out && product.stock <= LOW_STOCK_AT;
  const [first, second] = product.images;
  const href = `/product/${product.slug}`;

  const cartPayload = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price,
    salePrice: product.salePrice,
    image: first ?? "",
  };

  const toggleWishlist = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistBusy) return;
    setWishlistBusy(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("wishlist failed");
      setWishlisted((v) => !v);
      toast(wishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch {
      toast("Something went wrong. Please try again.");
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleAdd = (e: MouseEvent) => {
    e.preventDefault();
    addItem({ ...cartPayload, qty: 1 });
    toast("Added to cart");
  };

  const handleBuyNow = (e: MouseEvent) => {
    e.preventDefault();
    addItem({ ...cartPayload, qty: 1 });
    router.push("/checkout");
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="relative">
        <Link
          href={href}
          aria-label={product.title}
          className="relative block aspect-square overflow-hidden bg-soft-bg"
        >
          {first ? (
            <Image
              src={first}
              alt={`${product.title} - Buy online in Pakistan with Cash on Delivery | SKN Store`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              quality={60}
              className={cn(
                "object-cover transition-opacity duration-300",
                second && "group-hover:opacity-0"
              )}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm text-muted">
              No image
            </span>
          )}
          {second && (
            <Image
              src={second}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
          <span className="absolute inset-x-0 bottom-2 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-medium text-white">
              <IconEye className="h-3.5 w-3.5" />
              Quick View
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={toggleWishlist}
          disabled={wishlistBusy}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className="absolute right-2 top-2 rounded-full bg-surface/90 p-2 shadow-sm transition-colors hover:bg-surface disabled:opacity-50"
        >
          {wishlisted ? (
            <IconHeartFilled className="h-4 w-4 text-sale" />
          ) : (
            <IconHeart className="h-4 w-4 text-ink" />
          )}
        </button>

        <span
          className={cn(
            "absolute left-2 top-2 rounded-full px-2 py-1 text-[11px] font-semibold",
            out && "bg-error/10 text-error",
            low && "bg-warning/10 text-warning",
            !out && !low && "bg-success/10 text-success"
          )}
        >
          {out ? "Out of Stock" : low ? `Only ${product.stock} left` : "In Stock"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={href} className="hover:underline">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
            {product.title}
          </h3>
        </Link>
        <Rating value={product.ratingAvg} count={product.ratingCount} />
        <Price price={product.price} salePrice={product.salePrice} />

        <div className="mt-auto flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={out}
            className="flex-1 rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-soft-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={out}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}
