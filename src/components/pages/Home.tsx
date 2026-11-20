"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { cardReviewCount, formatPrice, popularItems, products, type Product } from "@/data/catalog";
import AddToCartButton from "@/components/AddToCartButton";
import ProductFavoriteButton from "@/components/ProductFavoriteButton";

const filters = ["Jacket", "Shoes", "Denim", "Bomber", "Outerwear"];

function JacketCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <article className="group relative min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f5f5f5] dark:bg-[#242424]">
        <Link href={`/products/${product.id}`} className="absolute inset-x-0 bottom-12 top-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 320px"
            className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <ProductFavoriteButton product={product} />
        <AddToCartButton product={product} className="absolute bottom-2.5 left-3 right-3 z-10" />
      </div>
      <Link href={`/products/${product.id}`} className="block pt-3">
        <h2 className="h-6 truncate text-sm font-medium leading-6 sm:text-base">{product.name}</h2>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden />
          <span className="text-foreground">{product.rating.toFixed(1)}</span>
          <span>({cardReviewCount(product).toLocaleString()} reviews)</span>
        </div>
        <p className="mt-2 text-sm font-medium">{formatPrice(product.price)}</p>
      </Link>
    </article>
  );
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("Jacket");
  const jackets = products.filter((product) => product.category === "jackets");
  const visibleJackets =
    activeFilter === "Jacket" || activeFilter === "Outerwear"
      ? jackets
      : jackets.filter((product) => product.name.toLowerCase().includes(activeFilter.toLowerCase()));

  return (
    <main className="home-page min-h-screen bg-background">
      <section className="container-x py-5 sm:py-10" aria-labelledby="popular-products-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h1 id="popular-products-title" className="text-base font-medium">Popular Product</h1>
          <Link
            href="/categories/jackets"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground/35"
          >
            See more
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3">
          {popularItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex h-[96px] items-center justify-between overflow-hidden rounded-2xl bg-neutral-100 pl-3 transition-colors hover:bg-neutral-200 dark:bg-muted dark:hover:bg-muted/80 sm:h-[112px]"
            >
              <span className="max-w-[78px] text-[15px] font-semibold leading-tight">{item.name}</span>
              <div className="relative h-full w-[46%] shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 25vw, 160px"
                  className={item.name === "Chaotic Club" ? "scale-[0.93] object-contain" : "object-cover"}
                />
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Shop categories">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`shrink-0 rounded-full px-4 py-2 text-xs transition-colors ${
                activeFilter === filter
                  ? "bg-foreground text-background"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/80"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {visibleJackets.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-5 sm:gap-y-4">
            {visibleJackets.map((product, index) => (
              <JacketCard key={product.id} product={product} priority={index < 2} />
            ))}
          </div>
        ) : (
          <p className="border-t border-border py-12 text-center text-sm text-muted-foreground">
            No products in this category yet.
          </p>
        )}
      </section>
    </main>
  );
}
