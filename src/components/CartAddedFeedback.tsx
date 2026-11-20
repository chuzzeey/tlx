"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice, type Product } from "@/data/catalog";

export interface CartAddedFeedbackItem {
  id: number;
  product: Product;
  quantity: number;
  size?: string;
}

function CartAddedPopup({ item }: { item: CartAddedFeedbackItem }) {
  const [phase, setPhase] = useState<"arrival" | "flight">("arrival");
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cartTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"))
        .map((element) => ({
          element,
          priority: Number(element.dataset.cartTargetPriority ?? 0),
        }))
        .filter(({ element }) => element.getClientRects().length > 0)
        .sort((a, b) => b.priority - a.priority);
      const cart = cartTargets[0]?.element;

      if (cart) {
        const bounds = cart.getBoundingClientRect();
        setTarget({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
      } else {
        setTarget({ x: window.innerWidth - 24, y: 24 });
      }
      setPhase("flight");
    }, 1350);

    return () => clearTimeout(timer);
  }, []);

  const flightTarget = target ?? { x: window.innerWidth - 24, y: 24 };

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "arrival" ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-white/40 backdrop-blur-md dark:bg-black/45"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.78)_0%,_rgba(229,231,235,0.36)_58%,_rgba(156,163,175,0.12)_100%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(39,39,42,0.72)_0%,_rgba(24,24,27,0.46)_58%,_rgba(9,9,11,0.32)_100%)]"
      />
      <motion.section
        role="status"
        aria-live="polite"
        initial={{ left: "115vw", top: "50vh", x: "-50%", y: "-50%", scale: 0.68, opacity: 0 }}
        animate={
          phase === "arrival"
            ? { left: "50vw", top: "50vh", x: "-50%", y: "-50%", scale: 1, opacity: 1 }
            : { left: flightTarget.x, top: flightTarget.y, x: "-50%", y: "-50%", scale: 0.08, opacity: 0 }
        }
        transition={
          phase === "arrival"
            ? { type: "spring", stiffness: 150, damping: 20 }
            : { duration: 0.72, ease: [0.22, 1, 0.36, 1] }
        }
        className="fixed flex w-[min(88vw,24rem)] flex-col items-center overflow-hidden rounded-[28px] bg-white/45 px-7 py-7 text-center shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:bg-neutral-950/75"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.88)_0%,_rgba(229,231,235,0.5)_58%,_rgba(156,163,175,0.2)_100%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(63,63,70,0.65)_0%,_rgba(39,39,42,0.42)_58%,_rgba(9,9,11,0.28)_100%)]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute top-8 h-40 w-40 rounded-full bg-white/90 blur-3xl dark:bg-white/10" />
        <div className="relative h-48 w-48 sm:h-56 sm:w-56">
          <Image
            src={item.product.image}
            alt=""
            fill
            sizes="(max-width: 640px) 192px, 224px"
            loading="eager"
            fetchPriority="high"
            className="object-contain drop-shadow-[0_22px_32px_rgba(15,23,42,0.2)]"
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
