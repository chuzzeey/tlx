"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
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
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  const handleAddToCart = () => {
    addToCart(product.id, 1);
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => {
      setAdded(false);
      addedTimer.current = null;
    }, 3200);
  };

  return (
    <motion.button
      type="button"
      disabled={!inStock}
      onClick={handleAddToCart}
      animate={undefined}
      transition={reduceMotion ? undefined : { duration: 0.16, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full border border-neutral-400/50 bg-[#EDE6D6] px-3 text-[11px] font-medium text-black shadow-sm backdrop-blur-sm transition-colors hover:border-neutral-500 hover:bg-[#EDE6D6] dark:border-neutral-500/50 dark:bg-neutral-900/70 dark:text-neutral-100 dark:hover:bg-neutral-900",
        !inStock && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {added && inStock ? (
          <motion.span
            key="added"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="inline-flex items-center gap-1.5"
          >
            Added
            <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {inStock ? label : "Out of stock"}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
