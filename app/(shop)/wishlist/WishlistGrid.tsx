"use client";

import { useCallback, useEffect, useState } from "react";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { IconHeart } from "@/components/Icons";

/**
 * Shared wishlist UI used by /wishlist and /account/wishlist.
 * Detects login state from the /api/wishlist response (401 = logged out),
 * so it works without a SessionProvider ancestor.
 */
export default function WishlistGrid() {
  const { toast } = useToast();
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "loggedOut" } | { kind: "ready"; products: ProductCardData[] }
  >({ kind: "loading" });
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (res.status === 401) {
        setState({ kind: "loggedOut" });
        return;
      }
      if (!res.ok) throw new Error("Could not load wishlist.");
      const data = await res.json();
      setState({ kind: "ready", products: data.products as ProductCardData[] });
    } catch {
      setState({ kind: "ready", products: [] });
      toast("Could not load your wishlist.");
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (productId: string) => {
    setRemoving(productId);
    try {
      const res = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not remove item.");
      setState((prev) =>
        prev.kind === "ready"
          ? { kind: "ready", products: prev.products.filter((p) => p.id !== productId) }
          : prev
      );
      toast("Removed from wishlist");
    } catch {
      toast("Could not remove that item. Please try again.");
    } finally {
      setRemoving(null);
    }
  };

  if (state.kind === "loading") {
    return <ProductGridSkeleton />;
  }

  if (state.kind === "loggedOut") {
    return (
      <EmptyState
        title="Please log in to view your wishlist"
        description="Save the products you love and find them here anytime."
        actionLabel="Log in"
        actionHref="/login?callbackUrl=/wishlist"
      />
    );
  }

  if (state.products.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here for later."
        actionLabel="Browse products"
        actionHref="/shop"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {state.products.map((p) => (
        <div key={p.id} className="relative">
          <ProductCard product={p} />
          <button
            type="button"
            onClick={() => remove(p.id)}
            disabled={removing === p.id}
            aria-label={`Remove ${p.title} from wishlist`}
            className="absolute right-2 top-2 z-10 rounded-full bg-white p-2 text-error shadow transition hover:scale-105 disabled:opacity-50"
          >
            <IconHeart />
          </button>
        </div>
      ))}
    </div>
  );
}
