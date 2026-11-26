"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { cardReviewCount, type Product } from "@/data/catalog";
import { useCatalog } from "@/store/CatalogContext";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";
import AddToCartButton from "@/components/AddToCartButton";
import ProductAvailabilityBadge from "@/components/ProductAvailabilityBadge";
import ProductFavoriteButton from "@/components/ProductFavoriteButton";
import { toTitleCase } from "@/lib/utils";

const popularImageBreaths = [
  { animationDuration: "5.2s", animationDelay: "-1.3s" },
  { animationDuration: "6.4s", animationDelay: "-4.8s" },
  { animationDuration: "4.7s", animationDelay: "-2.1s" },
  { animationDuration: "6.9s", animationDelay: "-5.6s" },
];
const scaledPopularProductNames = [
  "tlx flames tee",
  "tlx starlight",
  "tlx original black tee",
  "tlx original armless",
  "icon pink",
  "varsity black long",
  "varsity white long sleeve",
  "icon white tee",
];

function randomCardOrder(count: number) {
  const order = Array.from({ length: count }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  return order;
}

function PopularProductCard({
  product,
  index,
  isChanging,
  onTransitionComplete,
}: {
  product: Product;
  index: number;
  isChanging: boolean;
  onTransitionComplete: () => void;
}) {
  const titleCaseName = toTitleCase(product.name);
  const normalizedProductIdentity = `${product.name} ${product.id}`.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const shouldScaleImage = scaledPopularProductNames.some((name) => normalizedProductIdentity.includes(name));
  const containImage = product.id === "chaotic-club" || shouldScaleImage;
  const imageScaleClass = product.id === "chaotic-club" ? "scale-[0.93]" : shouldScaleImage ? "scale-[0.9]" : "";
  const [typedProduct, setTypedProduct] = useState({ productId: product.id, text: titleCaseName });

  useEffect(() => {
    if (!isChanging) return;

    let characterIndex = 0;
    let completionTimer: number | null = null;
    const typingTimer = window.setInterval(() => {
      characterIndex += 1;
      setTypedProduct({
        productId: product.id,
        text: titleCaseName.slice(0, characterIndex),
      });

      if (characterIndex >= titleCaseName.length) {
        window.clearInterval(typingTimer);
        completionTimer = window.setTimeout(onTransitionComplete, 350);
      }
    }, 45);

    return () => {
      window.clearInterval(typingTimer);
      if (completionTimer !== null) window.clearTimeout(completionTimer);
    };
  }, [isChanging, onTransitionComplete, product.id, titleCaseName]);

  const visibleName = isChanging
    ? typedProduct.productId === product.id ? typedProduct.text : ""
    : titleCaseName;
  const showImage = !isChanging || visibleName.length === titleCaseName.length;

  return (
    <Link
      href={`/products/${product.id}?from=home`}
      aria-label={`View ${product.name}`}
      className="flex h-[96px] items-center justify-between overflow-hidden rounded-2xl bg-white pl-3 shadow-[0_2px_12px_rgba(128,128,128,0.15)] sm:h-[112px] md:h-36 md:pl-4 lg:h-40"
    >
      <span
        className="brand-type max-w-[78px] text-[11px] font-bold leading-tight text-foreground uppercase md:max-w-[110px] md:text-xs"
        style={{ WebkitTextStroke: "0.25px currentColor" }}
      >
        {visibleName}
        {isChanging && (
          <span aria-hidden="true" className="ml-px inline-block h-[0.9em] w-px animate-pulse bg-current align-middle" />
        )}
      </span>
      <div className="relative h-full w-[46%] shrink-0 md:w-[42%]">
        <div className={`absolute inset-0 ${imageScaleClass}`}>
          <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${showImage ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
            <Image
              src={product.image}
              alt={product.name}
              fill
              quality={100}
              sizes="(max-width: 640px) 25vw, 160px"
              className={`popular-card-image-breathe ${containImage ? "object-contain" : "object-cover"}`}
              style={popularImageBreaths[index % popularImageBreaths.length]}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function JacketCard({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) {
  const { formatPrice } = useStorefrontCurrency();

  return (
    <article className="group relative min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(128,128,128,0.15)]">
        <Link href={`/products/${product.id}?from=home`} className="absolute inset-x-0 bottom-12 top-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            quality={100}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 320px"
            className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <ProductAvailabilityBadge product={product} />
        <ProductFavoriteButton product={product} />
        <AddToCartButton product={product} className="absolute bottom-2.5 left-3 right-3 z-10" />
      </div>
      <Link href={`/products/${product.id}?from=home`} className="block pt-3">
        <h2 className="h-6 truncate text-xs font-semibold leading-6 sm:text-sm">{product.name}</h2>
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
  const { products, categories, status, error } = useCatalog();
  const filters = [{ label: "All", category: "all" }, ...categories.map((item) => ({ label: item.name, category: item.slug }))];
  const initialPopularProducts = useMemo(
    () => [
      ...products.filter((product) => product.featured),
      ...products.filter((product) => !product.featured),
    ].slice(0, 4),
    [products]
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [popularSelection, setPopularSelection] = useState<{
    catalog: Product[];
    items: Product[];
  } | null>(null);
  const popularProducts = popularSelection?.catalog === products
    ? popularSelection.items
    : initialPopularProducts;
  const [changingPopularIndex, setChangingPopularIndex] = useState<number | null>(null);
  const popularProductsRef = useRef<Product[]>([]);
  const popularRotationTimer = useRef<number | null>(null);
  const popularRotationOrder = useRef<number[]>([]);
  const nextRotationPosition = useRef(0);
  const startPopularChange = useCallback((index: number) => {
    const displayedIds = new Set(popularProductsRef.current.map((product) => product.id));
    const alternatives = products.filter((product) => !displayedIds.has(product.id));
    if (alternatives.length === 0) return;

    const nextProduct = alternatives[Math.floor(Math.random() * alternatives.length)];
    const nextProducts = popularProductsRef.current.map((product, slot) =>
      slot === index ? nextProduct : product
    );
    popularProductsRef.current = nextProducts;
    setPopularSelection({ catalog: products, items: nextProducts });
    setChangingPopularIndex(index);
  }, [products]);
  const handlePopularTransitionComplete = useCallback(() => {
    setChangingPopularIndex(null);
    if (nextRotationPosition.current < popularRotationOrder.current.length) {
      const nextIndex = popularRotationOrder.current[nextRotationPosition.current];
      nextRotationPosition.current += 1;
      if (nextIndex !== undefined) {
        popularRotationTimer.current = window.setTimeout(() => startPopularChange(nextIndex), 1000);
      }
      return;
    }

    popularRotationTimer.current = window.setTimeout(() => {
      const order = randomCardOrder(initialPopularProducts.length);
      popularRotationOrder.current = order;
      nextRotationPosition.current = 1;
      const firstIndex = order[0];
      if (firstIndex !== undefined) startPopularChange(firstIndex);
    }, 3000);
  }, [initialPopularProducts.length, startPopularChange]);

  useEffect(() => {
    popularProductsRef.current = popularProducts;
  }, [popularProducts]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    popularRotationOrder.current = randomCardOrder(initialPopularProducts.length);
    nextRotationPosition.current = 1;
    const firstIndex = popularRotationOrder.current[0];
    if (firstIndex === undefined) return;

    popularRotationTimer.current = window.setTimeout(() => startPopularChange(firstIndex), 3000);
    return () => {
      if (popularRotationTimer.current !== null) window.clearTimeout(popularRotationTimer.current);
    };
  }, [initialPopularProducts.length, startPopularChange]);

  const visibleProducts =
    activeFilter === "all"
      ? categories.flatMap((category) => products.filter((product) => product.category === category.slug))
      : products.filter((product) => product.category === activeFilter);
  const displayedProducts = visibleProducts.slice(0, 12);
  const hasMoreProducts = visibleProducts.length > displayedProducts.length;
  const viewAllHref = activeFilter === "all" ? "/products" : `/categories/${activeFilter}`;

  return (
    <main className="home-page min-h-screen bg-background">
      <section className="container-x py-5 sm:py-10 md:py-12 lg:py-14" aria-labelledby="popular-products-title">
        {status === "error" && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {error ?? "The store catalog could not be loaded. Please try again."}
          </p>
        )}
        <div className="mb-3 flex items-center justify-between gap-4">
          <h1 id="popular-products-title" className="text-base font-medium md:text-xl lg:text-2xl">Popular Product</h1>
          <Link
            href={activeFilter === "all" ? "/products" : `/categories/${activeFilter}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground/35 md:text-base"
          >
            See more
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3 md:mb-8 md:grid-cols-4 md:gap-4">
          {popularProducts.map((product, index) => (
            <PopularProductCard
              key={index}
              product={product}
              index={index}
              isChanging={changingPopularIndex === index}
              onTransitionComplete={handlePopularTransitionComplete}
            />
          ))}
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0" role="group" aria-label="Shop categories">
          {filters.map((filter) => (
            <button
              key={filter.category}
              type="button"
              onClick={() => setActiveFilter(filter.category)}
              aria-pressed={activeFilter === filter.category}
              className={`shrink-0 rounded-3xl px-4 py-2 text-xs transition-colors ${
                activeFilter === filter.category
                  ? "bg-black font-medium text-white"
                  : "bg-white text-neutral-600 hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {status === "loading" ? (
          <p role="status" className="border-t border-border py-12 text-center text-sm text-muted-foreground">
            Loading products…
          </p>
        ) : status === "error" ? null : visibleProducts.length > 0 ? (
          <div className="mx-auto grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-5 sm:gap-y-4 md:grid-cols-3 md:gap-y-6 lg:max-w-5xl lg:gap-x-8">
            {displayedProducts.map((product, index) => (
              <JacketCard key={product.id} product={product} eager={index === 0} />
            ))}
          </div>
        ) : (
          <p className="border-t border-border py-12 text-center text-sm text-muted-foreground">
            No products in this category yet.
          </p>
        )}
        {hasMoreProducts && (
          <div className="mt-8 flex justify-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              View all in store
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
