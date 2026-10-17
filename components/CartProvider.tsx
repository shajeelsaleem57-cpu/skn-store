"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { effectivePrice } from "@/lib/utils";

export type CartItem = {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string;
  qty: number;
  variant?: string;
};

export type AddItemInput = Omit<CartItem, "qty"> & { qty?: number };

type CartContextValue = {
  items: CartItem[];
  addItem: (item: AddItemInput) => void;
  removeItem: (id: string, variant?: string) => void;
  updateQty: (id: string, qty: number, variant?: string) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "skn-cart-v1";

function keyOf(item: Pick<CartItem, "id" | "variant">): string {
  return `${item.id}::${item.variant ?? ""}`;
}

function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is CartItem =>
      !!x &&
      typeof x.id === "string" &&
      typeof x.title === "string" &&
      typeof x.price === "number" &&
      typeof x.qty === "number" &&
      x.qty > 0
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(sanitize(JSON.parse(raw)));
    } catch {
      /* corrupted cart — start fresh */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full/blocked — cart still works in memory */
    }
  }, [items, hydrated]);

  const addItem = useCallback((input: AddItemInput) => {
    const qty = Math.max(1, Math.floor(input.qty ?? 1));
    setItems((prev) => {
      const k = keyOf(input);
      const existing = prev.find((p) => keyOf(p) === k);
      if (existing) {
        return prev.map((p) =>
          keyOf(p) === k ? { ...p, qty: Math.min(99, p.qty + qty) } : p
        );
      }
      return [...prev, { ...input, qty }];
    });
  }, []);

  const removeItem = useCallback((id: string, variant?: string) => {
    const k = `${id}::${variant ?? ""}`;
    setItems((prev) => prev.filter((p) => keyOf(p) !== k));
  }, []);

  const updateQty = useCallback((id: string, qty: number, variant?: string) => {
    const k = `${id}::${variant ?? ""}`;
    const next = Math.floor(qty);
    setItems((prev) =>
      next <= 0
        ? prev.filter((p) => keyOf(p) !== k)
        : prev.map((p) =>
            keyOf(p) === k ? { ...p, qty: Math.min(99, next) } : p
          )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const it of items) {
      c += it.qty;
      s += effectivePrice(it.price, it.salePrice) * it.qty;
    }
    return { count: c, subtotal: s };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      count,
      subtotal,
      isOpen,
      setOpen,
    }),
    [items, addItem, removeItem, updateQty, clearCart, count, subtotal, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
