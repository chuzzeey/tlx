"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { type Product } from "@/data/catalog";
import { useCatalog } from "@/store/CatalogContext";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";
import { EASE } from "@/components/motion/motion";
import FadeImage from "@/components/FadeImage";
import AddToCartButton from "@/components/AddToCartButton";
import ProductAvailabilityBadge from "@/components/ProductAvailabilityBadge";
import ProductFavoriteButton from "@/components/ProductFavoriteButton";

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < Math.round(rating) ? "fill-foreground text-foreground" : "text-border"}`}
        />
      ))}
    </span>
  );
}

export default function ProductCard({
  product,
  index,
  showIndex = true,
  compact = false,
}: {
  product: Product;
  index?: number;
  showIndex?: boolean;
  compact?: boolean;
}) {
  const { categories } = useCatalog();
  const { formatPrice } = useStorefrontCurrency();
  return (
    <motion.div
      layout
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="hairline-cell group relative transition-colors duration-300"
    >
      <Link
        href={`/products/${encodeURIComponent(product.id)}`}
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      {/* The cell frame (borders) stays static — only the content inside animates */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px 80px 0px" }}
        transition={{ duration: 0.7, delay: Math.min((index ?? 0) * 0.045, 0.35), ease: EASE }}
        className={`pointer-events-none relative z-20 flex h-full flex-col ${compact ? "p-3 sm:p-4" : "p-5"}`}
      >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`label-mono ${compact ? "text-[9px] normal-case leading-4 tracking-normal" : ""}`}>{categories.find((category) => category.slug === product.category)?.name ?? product.category}</p>
          <span className={`link-underline mt-1.5 block font-medium leading-snug ${compact ? "min-h-10 text-[13px] sm:text-sm" : "text-sm"}`}>{product.name}</span>
        </div>
        {showIndex && typeof index === "number" && (
          <span className="font-mono2 text-[10px] text-muted-foreground">{String(index + 1).padStart(3, "0")}</span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className={`font-mono2 ${compact ? "text-[13px]" : "text-sm"}`}>
          {formatPrice(product.price)}
          {product.compareAt && (
            <span className="ml-2 text-xs text-muted-foreground line-through">{formatPrice(product.compareAt)}</span>
          )}
        </span>
        <ProductAvailabilityBadge
          product={product}
          className={compact ? "ml-auto scale-90 origin-right" : "ml-auto"}
        />
      </div>

      <div className={`relative aspect-square overflow-hidden rounded-xl bg-[#EEE8D5] ${compact ? "mt-3" : "mt-4"}`}>
        <FadeImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
          className="h-full w-full bg-transparent"
          placeholderClassName="bg-[#EEE8D5]"
          imgClassName="h-full w-full object-contain p-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
        />
        {product.badge && (
          <span
            className={`absolute left-2 top-2 z-10 rounded-full px-2 py-1 font-mono2 text-[9px] uppercase tracking-[0.15em] ${
              product.badge === "Sale"
                ? "bg-destructive text-destructive-foreground"
                : "bg-foreground text-background"
            }`}
          >
            {product.badge}
          </span>
        )}
        <ProductFavoriteButton product={product} />
        <AddToCartButton
          product={product}
          label="Add to cart"
          className="pointer-events-auto absolute bottom-2.5 left-3 right-3 z-10 rounded-full"
        />
      </div>
      </motion.div>
    </motion.div>
  );
}

export function PageHeader({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="border-b border-border">
      <div className="container-x py-12 sm:py-16">
        <motion.p
          className="label-mono"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
        >
          {kicker}
        </motion.p>
        <div className="mt-3 max-w-3xl overflow-hidden pb-[0.2em] -mb-[0.2em]">
          <motion.h1
            className="font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            initial={{ y: "125%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.12, ease: EASE }}
          >
            {title}
          </motion.h1>
        </div>
        {lede && (
          <motion.p
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
          >
            {lede}
          </motion.p>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="flex flex-col items-center"
      >
        <p className="label-mono">Nothing here yet</p>
        <h2 className="mt-4 font-display text-3xl font-light sm:text-4xl">{title}</h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
        <Link href={href} className="btn-outline-invert mt-8">
          {cta}
        </Link>
      </motion.div>
    </div>
  );
}

/** Quiet skeleton shown while the persisted bag/wishlist hydrates — keeps
 *  server-rendered HTML and the first client render identical. */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="container-x py-16" aria-hidden>
      <div className="h-4 w-32 animate-pulse bg-muted" />
      <div className="mt-4 h-10 w-72 animate-pulse bg-muted" />
      <div className="mt-12 space-y-6 border-t border-border pt-6">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-5">
            <div className="h-28 w-28 shrink-0 animate-pulse border border-border bg-muted sm:h-32 sm:w-32" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-4 w-1/3 animate-pulse bg-muted" />
              <div className="h-3 w-1/4 animate-pulse bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
