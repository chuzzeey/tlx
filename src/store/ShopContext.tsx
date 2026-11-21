"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCatalog } from "@/store/CatalogContext";
import type { Product } from "@/data/catalog";
import { isProductInStock } from "@/lib/product-availability";
import { defaultProductSize } from "@/lib/product-variants";
import CartAddedFeedback, { type CartAddedFeedbackItem } from "@/components/CartAddedFeedback";
import FavoriteAddedToast, { type FavoriteFeedbackItem } from "@/components/FavoriteAddedToast";
import { toast } from "sonner";

export interface CartLine {
  productId: string;
  qty: number;
  color?: string;
  size?: string;
}

interface ShopCtx {
  cart: CartLine[];
  wishlist: string[];
  recent: string[];
  /** False during SSR/first paint; true once localStorage has been read. */
  hydrated: boolean;
  addToCart: (productId: string, qty?: number, color?: string, size?: string) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  setQty: (productId: string, qty: number, color?: string, size?: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  recordView: (productId: string) => void;
  cartCount: number;
  subtotal: number;
}

function defaultSizeForProduct(productId: string, products: Product[]): string | undefined {
  const product = products.find((candidate) => candidate.id === productId);
  return product ? defaultProductSize(product) : undefined;
}

const Ctx = createContext<ShopCtx | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const { products, aliases, status } = useCatalog();
  /* Start empty so server-rendered HTML and the first client render match;
     the persisted bag/wishlist/trail hydrate immediately after mount. */
  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [addedFeedback, setAddedFeedback] = useState<CartAddedFeedbackItem | null>(null);
  const [favoriteFeedback, setFavoriteFeedback] = useState<FavoriteFeedbackItem | null>(null);
  const feedbackId = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const favoriteFeedbackId = useRef(0);
  const favoriteFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedCart = load<CartLine[]>("aurelle-cart", []);
    setCart(savedCart);
    setWishlist(load("aurelle-wishlist", []));
    setRecent(load("aurelle-recent", []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setCart((current) =>
      current.map((line) =>
        line.size ? line : { ...line, size: defaultSizeForProduct(line.productId, products) }
      )
    );
  }, [hydrated, products]);

  useEffect(() => {
    if (!hydrated || status !== "ready") return;
    const migrateId = (id: string) => aliases[id] ?? id;
    setCart((current) => current.map((line) => {
      const productId = migrateId(line.productId);
      return productId === line.productId ? line : { ...line, productId };
    }));
    setWishlist((current) => [...new Set(current.map(migrateId))]);
    setRecent((current) => [...new Set(current.map(migrateId))]);
  }, [aliases, hydrated, status]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("aurelle-cart", JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("aurelle-wishlist", JSON.stringify(wishlist));
  }, [wishlist, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("aurelle-recent", JSON.stringify(recent));
  }, [recent, hydrated]);
  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    if (favoriteFeedbackTimer.current) clearTimeout(favoriteFeedbackTimer.current);
  }, []);

  const recordView = (productId: string) =>
    setRecent((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 6));

  const addToCart: ShopCtx["addToCart"] = (productId, qty = 1, color, size) => {
    const product = products.find((candidate) => candidate.id === productId);
    if (product && !isProductInStock(product)) {
      toast.error("This item is out of stock.", { description: product.name });
      return;
    }
    const selectedSize = size ?? defaultSizeForProduct(productId, products);
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId && l.color === color && l.size === selectedSize);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(next[idx].qty + qty, 99) };
        return next;
      }
      return [...prev, { productId, qty, color, size: selectedSize }];
    });
    if (product) {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackId.current += 1;
      setAddedFeedback({
        id: feedbackId.current,
        product,
        size: selectedSize,
        color: color ?? product.colors?.[0]?.name,
        quantity: qty
      });
      feedbackTimer.current = setTimeout(() => {
        setAddedFeedback(null);
        feedbackTimer.current = null;
      }, 2400);
    }
  };

  const removeFromCart: ShopCtx["removeFromCart"] = (productId, color, size) =>
    setCart((prev) => prev.filter((l) => !(l.productId === productId && l.color === color && l.size === size)));

  const setQty: ShopCtx["setQty"] = (productId, qty, color, size) => {
    if (qty <= 0) return removeFromCart(productId, color, size);
    setCart((prev) =>
      prev.map((l) => (l.productId === productId && l.color === color && l.size === size ? { ...l, qty } : l))
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist: ShopCtx["toggleWishlist"] = (productId) => {
    const exists = wishlist.includes(productId);
    const product = products.find((candidate) => candidate.id === productId);
    setWishlist((prev) =>
      exists ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    if (product) {
      if (favoriteFeedbackTimer.current) clearTimeout(favoriteFeedbackTimer.current);
      favoriteFeedbackId.current += 1;
      setFavoriteFeedback({ id: favoriteFeedbackId.current, product, added: !exists });
      favoriteFeedbackTimer.current = setTimeout(() => {
        setFavoriteFeedback(null);
        favoriteFeedbackTimer.current = null;
      }, 2000);
    }
  };

  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);
  const subtotal = useMemo(
    () => cart.reduce((s, l) => s + (products.find((product) => product.id === l.productId)?.price ?? 0) * l.qty, 0),
    [cart, products]
  );

  return (
    <Ctx.Provider
      value={{ cart, wishlist, recent, hydrated, addToCart, removeFromCart, setQty, clearCart, toggleWishlist, recordView, cartCount, subtotal }}
    >
      {children}
      <CartAddedFeedback item={addedFeedback} />
      <FavoriteAddedToast item={favoriteFeedback} />
    </Ctx.Provider>
  );
}

export function useShop() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
