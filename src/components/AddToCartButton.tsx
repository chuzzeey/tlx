"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/catalog";
import { isProductInStock } from "@/lib/product-availability";
import { useShop } from "@/store/ShopContext";

export default function AddToCartButton({
  product,
  className,
  label = "Add to cart",
}: {
  product: Product;
  className?: string;
  label?: string;
}) {
  const { addToCart } = useShop();
  const reduceMotion = useReducedMotion();
  const inStock = isProductInStock(product);

  return (
    <motion.button
      type="button"
      disabled={!inStock}
      onClick={() => addToCart(product.id, 1, product.colors?.[0]?.name)}
      animate={reduceMotion || !inStock ? undefined : { rotate: [0, -0.5, 0.5, 0] }}
      transition={reduceMotion ? undefined : { duration: 0.4, repeat: Infinity, repeatDelay: 4.5, ease: "easeInOut" }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full border border-neutral-400/50 bg-white/75 px-3 font-mono2 text-[10px] uppercase tracking-[0.16em] text-neutral-800 shadow-sm backdrop-blur-sm transition-colors hover:border-neutral-500 hover:bg-white/95 dark:border-neutral-500/50 dark:bg-neutral-900/70 dark:text-neutral-100 dark:hover:bg-neutral-900",
        !inStock && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {inStock ? label : "Out of stock"}
    </motion.button>
  );
}
