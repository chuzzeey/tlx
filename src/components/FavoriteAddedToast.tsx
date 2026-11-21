"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Product } from "@/data/catalog";

export interface FavoriteFeedbackItem {
  id: number;
  product: Product;
  added: boolean;
}

export default function FavoriteAddedToast({ item }: { item: FavoriteFeedbackItem | null }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {item && (
        <motion.div
          key={item.id}
          role="status"
          aria-live="polite"
          initial={{ left: "50vw", top: "1rem", x: "-50%", y: -64, opacity: 0, scale: 0.96 }}
          animate={{ left: "50vw", top: "1rem", x: "-50%", y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -64, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed z-[130] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-neutral-200 bg-neutral-100/95 px-4 py-3 text-sm text-neutral-800 shadow-lg backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900/95 dark:text-neutral-100"
        >
          <Heart className="h-4 w-4 shrink-0 fill-neutral-900 text-neutral-900 dark:fill-neutral-100 dark:text-neutral-100" aria-hidden="true" />
          <span className="truncate">
            <span className="font-medium">{item.added ? "Added to favorites" : "Removed from favorites"}</span>
            <span className="ml-1.5 text-muted-foreground">{item.product.name}</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
