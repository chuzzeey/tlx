"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, X } from "lucide-react";
import { isProductInStock } from "@/lib/product-availability";
import { EmptyState, PageHeader, PageSkeleton } from "@/components/ProductCard";
import { Footnote } from "@/components/Ornaments";
import { useShop } from "@/store/ShopContext";
import { useCatalog } from "@/store/CatalogContext";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";
import { toast } from "sonner";

export default function Wishlist() {
  const { products } = useCatalog();
  const { formatPrice } = useStorefrontCurrency();
  const { wishlist, toggleWishlist, addToCart, hydrated } = useShop();

  if (!hydrated) return <PageSkeleton />;

  if (wishlist.length === 0) {
    return (
      <EmptyState
        title="No saved pieces yet."
        body="Tap the heart on any product to keep it here — for paydays, birthdays, or the corner that's still empty."
        cta="Discover the collection"
        href="/products"
      />
    );
  }

  return (
    <div>
      <PageHeader
        kicker={`${wishlist.length} saved ${wishlist.length === 1 ? "piece" : "pieces"}`}
        title="The wishlist."
        lede="Kept safely in this browser until you're ready. Stock levels are live — low-stock pieces won't wait forever."
      />
      <div className="container-x py-12">
        <div className="divide-y divide-border border-y border-border">
          {wishlist.map((id) => {
            const p = products.find((product) => product.id === id);
            if (!p) return null;
            const inStock = isProductInStock(p);
            const low = inStock && p.stock <= 8;
            return (
              <div key={id} className="flex items-center gap-5 py-5">
                <Link href={`/products/${p.id}`} className="shrink-0 border border-border">
                  <Image src={p.image} alt={p.name} width={96} height={96} sizes="96px" className="h-24 w-24 bg-[#EEE8D5] object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${p.id}`} className="link-underline font-medium">{p.name}</Link>
                  <p className={`mt-1 font-mono2 text-[11px] uppercase tracking-[0.12em] ${!inStock ? "text-destructive" : low ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>
                    {!inStock ? "Out of stock" : low ? `Only ${p.stock} left` : "In stock"}
                  </p>
                </div>
                <p className="hidden font-mono2 text-sm sm:block">{formatPrice(p.price)}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!inStock}
                    aria-label={inStock ? `Move ${p.name} to bag` : `${p.name} is out of stock`}
                    onClick={() => {
                      addToCart(p.id, 1);
                      toggleWishlist(p.id);
                      toast.success("Moved to bag", { description: p.name });
                    }}
                    className="btn-outline-invert !px-4 !py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingBag className="h-4 w-4" /> <span className="hidden sm:inline">{inStock ? "Move to bag" : "Out of stock"}</span>
                  </button>
                  <button
                    onClick={() => toggleWishlist(p.id)}
                    aria-label="Remove from wishlist"
                    className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-6">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" /> Wishlists live in this browser — sign in on any device to sync them (demo).
          </p>
          <Link href="/products" className="link-underline font-mono2 text-[11px] uppercase tracking-[0.18em]">
            Keep browsing
          </Link>
        </div>
        <Footnote className="mt-4">
          Nothing here expires — but stock does.
        </Footnote>
      </div>
    </div>
  );
}
