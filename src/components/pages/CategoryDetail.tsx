"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Handbag, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cardReviewCount, categoryBySlug, formatPrice, productsByCategory, type Product } from "@/data/catalog";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import ProductFavoriteButton from "@/components/ProductFavoriteButton";
import { ImageReveal } from "@/components/motion/motion";
import { Footnote } from "@/components/Ornaments";
import { useShop } from "@/store/ShopContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Sort = "featured" | "price-asc" | "price-desc" | "rating";

function MobileProductCard({ product }: { product: Product }) {
  return (
    <article className="min-w-0">
      <div className="relative aspect-[0.9] overflow-hidden rounded-2xl bg-neutral-100">
        <Link href={`/products/${product.id}`} className="absolute inset-x-0 bottom-12 top-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 767px) 50vw"
            className="object-contain p-2"
          />
        </Link>
        <ProductFavoriteButton product={product} />
        <AddToCartButton product={product} className="absolute bottom-2.5 left-3 right-3 z-10" />
      </div>
      <Link href={`/products/${product.id}`} className="mt-2 block truncate text-sm font-medium">
        {product.name}
      </Link>
      <div className="mt-1 flex min-w-0 items-center gap-1 text-xs">
        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" aria-hidden="true" />
        <span className="shrink-0">{product.rating.toFixed(1)}</span>
        <span className="truncate text-muted-foreground">
          ({cardReviewCount(product).toLocaleString()} Reviews)
        </span>
      </div>
      <p className="mt-1.5 text-base font-semibold">{formatPrice(product.price)}</p>
    </article>
  );
}

export default function CategoryDetail({ categoryId }: { categoryId: string }) {
  const category = categoryBySlug(categoryId);
  const { cartCount } = useShop();
  const [sort, setSort] = useState<Sort>("featured");
  const [selectedProductId, setSelectedProductId] = useState("all");

  if (!category) {
    return (
      <div className="container-x py-24 text-center">
        <p className="font-display text-3xl font-light">That department doesn't exist.</p>
        <Link href="/categories" className="btn-outline-invert mt-8">All categories</Link>
      </div>
    );
  }

  let items = productsByCategory(category.slug);
  if (sort === "price-asc") items = [...items].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
  if (sort === "rating") items = [...items].sort((a, b) => b.rating - a.rating);
  const selectedFilter = items.some((item) => item.id === selectedProductId) ? selectedProductId : "all";
  const visibleItems = selectedFilter === "all" ? items : items.filter((item) => item.id === selectedFilter);

  return (
    <div>
      <div className="md:hidden">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-3">
          <Link
            href="/categories"
            aria-label="Back to categories"
            className="flex h-11 w-11 items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="text-sm font-semibold">Category</p>
          <Link
            href="/cart"
            aria-label={`Shopping bag, ${cartCount} items`}
            data-cart-target
            data-cart-target-priority="2"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100"
          >
            <Handbag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        <div className="container-x space-y-5 py-4">
          <div className="relative flex h-32 items-center overflow-hidden rounded-3xl bg-neutral-100 px-5">
            <div className="relative z-10 w-[54%]">
              <h1 className="text-xl font-semibold leading-tight">{category.name}</h1>
              <p className="mt-1.5 line-clamp-2 max-w-[150px] text-sm leading-tight text-muted-foreground">
                {category.tagline}
              </p>
              <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-medium">
                {items.length} {items.length === 1 ? "Product" : "Products"}
              </span>
            </div>
            <Image
              src={category.image}
              alt=""
              fill
              sizes="(max-width: 767px) 50vw"
              className="object-contain object-right p-2"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={`${category.name} filters`}>
            <button
              type="button"
              onClick={() => setSelectedProductId("all")}
              aria-pressed={selectedFilter === "all"}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${
                selectedFilter === "all" ? "bg-foreground text-background" : "bg-neutral-100 text-muted-foreground"
              }`}
            >
              All
            </button>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedProductId(item.id)}
                aria-pressed={selectedFilter === item.id}
                className={`shrink-0 rounded-full px-4 py-2 text-sm ${
                  selectedFilter === item.id
                    ? "bg-foreground text-background"
                    : "bg-neutral-100 text-muted-foreground"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {visibleItems.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 pb-6">
              {visibleItems.map((product) => (
                <MobileProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No products in this category yet.</p>
          )}
        </div>
      </div>

      <div className="hidden md:block">
      {/* Category hero */}
      <div className="border-b border-border">
        <div className="container-x grid items-center gap-10 py-12 lg:grid-cols-2">
          <div>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 font-mono2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> All categories
            </Link>
            <h1 className="mt-4 font-display text-4xl font-light tracking-tight sm:text-5xl lg:text-6xl">
              {category.name}
            </h1>
            <p className="mt-2 font-mono2 text-[11px] uppercase tracking-[0.18em] text-primary">{category.tagline}</p>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">{category.description}</p>
            <p className="mt-6 font-mono2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {items.length} {items.length === 1 ? "piece" : "pieces"} in the collection
            </p>
            <Footnote className="mt-6">
              Photographed in-studio on the last overcast Tuesday of August.
            </Footnote>
          </div>
          <div className="border border-border">
            <ImageReveal
              src={category.image}
              alt={category.name}
              className="aspect-[3/2]"
              imgClassName="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container-x py-12">
        <div className="mb-8 flex items-center justify-between">
          <p className="label-mono">The collection</p>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-[190px] rounded-none border-border bg-transparent font-mono2 text-xs uppercase tracking-wider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: low → high</SelectItem>
              <SelectItem value="price-desc">Price: high → low</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
          <motion.div layout className="hairline-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>

        <div className="mt-14 border border-border bg-card p-8 text-center sm:p-12">
          <p className="font-display text-2xl font-light">Looking for something we don't stock yet?</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Our buyers take requests seriously. Tell us what your home is missing and we'll look for a maker.
          </p>
          <Link href="/support/contact" className="btn-outline-invert mt-6">Make a request</Link>
        </div>
      </div>
      </div>
    </div>
  );
}
