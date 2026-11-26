"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { type Product } from "@/data/catalog";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";

export interface CartAddedFeedbackItem {
  id: number;
  product: Product;
  quantity: number;
  size?: string;
}

interface CartTarget {
  x: number;
  y: number;
}

function CartAddedPopup({ item }: { item: CartAddedFeedbackItem }) {
  const { formatPrice } = useStorefrontCurrency();
  const [phase, setPhase] = useState<"arrival" | "flight">("arrival");
  const [target, setTarget] = useState<CartTarget | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cart = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"))
        .map((element) => ({
          element,
          priority: Number(element.dataset.cartTargetPriority ?? 0),
        }))
        .filter(({ element }) => element.getClientRects().length > 0)
        .sort((a, b) => b.priority - a.priority)[0]?.element;
      const bounds = cart?.getBoundingClientRect();

      setTarget(
        bounds
          ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
          : { x: window.innerWidth - 24, y: 24 }
      );
      setPhase("flight");
    }, 1450);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "arrival" ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.section
        role="status"
        aria-live="polite"
        initial={{ left: "115vw", top: "50vh", x: "-50%", y: "-50%", scale: 0.72, opacity: 0 }}
        animate={
          phase === "arrival"
            ? { left: "50vw", top: "50vh", x: "-50%", y: "-50%", scale: 1, opacity: 1 }
            : {
                left: target?.x ?? "50vw",
                top: target?.y ?? "50vh",
                x: "-50%",
                y: "-50%",
                scale: [1, 0.55, 0.06],
                opacity: [1, 0.95, 0],
              }
        }
        exit={{ scale: 0.92, opacity: 0 }}
        transition={
          phase === "arrival"
            ? { type: "spring", stiffness: 150, damping: 20 }
            : { duration: 0.82, ease: [0.22, 1, 0.36, 1], times: [0, 0.58, 1] }
        }
        className="fixed z-20 flex w-[min(88vw,24rem)] flex-col items-center overflow-hidden rounded-[28px] bg-white px-7 py-7 text-center shadow-[0_2px_12px_rgba(128,128,128,0.15)]"
      >
        <div className="relative h-48 w-48 overflow-hidden rounded-2xl bg-white sm:h-56 sm:w-56">
          <Image
            src={item.product.image}
            alt=""
            fill
            quality={100}
            sizes="(max-width: 640px) 192px, 224px"
            loading="eager"
            fetchPriority="high"
            className="object-contain"
          />
        </div>
        <p className="relative label-mono mt-2">Added to cart</p>
        <p className="relative mt-2 font-display text-xl font-light">{item.product.name}</p>
        {item.size && <p className="relative mt-1 text-sm text-muted-foreground">Size: {item.size}</p>}
        <p className="relative mt-3 text-sm font-medium">
          {item.quantity > 1 && <span className="mr-1.5 text-muted-foreground">{item.quantity} ×</span>}
          {formatPrice(item.product.price * item.quantity)}
        </p>
      </motion.section>
    </motion.div>
  );
}

export default function CartAddedFeedback({ item }: { item: CartAddedFeedbackItem | null }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {item && <CartAddedPopup key={item.id} item={item} />}
    </AnimatePresence>,
    document.body
  );
}
