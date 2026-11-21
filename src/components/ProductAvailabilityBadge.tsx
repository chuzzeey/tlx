import type { Product } from "@/data/catalog";
import { isProductInStock } from "@/lib/product-availability";

export default function ProductAvailabilityBadge({ product }: { product: Product }) {
  const inStock = isProductInStock(product);

  return (
    <span
      className={`absolute bottom-[3.25rem] left-3 z-10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono2 text-[9px] uppercase tracking-[0.12em] shadow-[0_2px_8px_rgba(15,23,42,0.12)] backdrop-blur-sm ${
        inStock
          ? "border-emerald-200/80 bg-white/90 text-emerald-800 dark:border-emerald-900/80 dark:bg-neutral-950/85 dark:text-emerald-300"
          : "border-rose-200/80 bg-white/90 text-rose-800 dark:border-rose-900/80 dark:bg-neutral-950/85 dark:text-rose-300"
      }`}
    >
      <span className={`size-1.5 rounded-full ${inStock ? "bg-emerald-600" : "bg-rose-600"}`} aria-hidden="true" />
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}
