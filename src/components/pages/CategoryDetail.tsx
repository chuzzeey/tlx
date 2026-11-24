"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Handbag, Star } from "lucide-react";
import { cardReviewCount, type Product } from "@/data/catalog";
import { useCatalog } from "@/store/CatalogContext";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";
import AddToCartButton from "@/components/AddToCartButton";
import ProductAvailabilityBadge from "@/components/ProductAvailabilityBadge";
import ProductFavoriteButton from "@/components/ProductFavoriteButton";
import { useShop } from "@/store/ShopContext";
import { toTitleCase } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Sort = "featured" | "price-asc" | "price-desc" | "rating";

function MobileProductCard({ product }: { product: Product }) {
  const { formatPrice } = useStorefrontCurrency();

  return (
    <article className="min-w-0">
      <div className="relative aspect-[0.9] overflow-hidden rounded-2xl bg-gray-100">
        <Link href={`/products/${product.id}`} className="absolute inset-x-0 bottom-12 top-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
            className="object-contain p-2"
          />
        </Link>
        <ProductAvailabilityBadge product={product} />
        <ProductFavoriteButton product={product} />
        <AddToCartButton product={product} className="absolute bottom-2.5 left-3 right-3 z-10" />
      </div>
      <Link href={`/products/${product.id}`} className="mt-2 block h-6 truncate text-xs font-semibold leading-6 sm:text-sm">
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
  const { products, categories, status, error } = useCatalog();
  const category = categories.find((item) => item.slug === categoryId);
  const { cartCount } = useShop();
  const [sort, setSort] = useState<Sort>("featured");
  const [selectedProductId, setSelectedProductId] = useState("all");

  if (!category && status === "loading") {
    return (
      <p role="status" className="container-x py-24 text-center text-sm text-muted-foreground">
        Loading category…
      </p>
    );
  }

  if (!category && status === "error") {
    return (
      <p role="alert" className="container-x py-24 text-center text-sm text-destructive">
        {error ?? "The store catalog could not be loaded. Please try again."}
      </p>
    );
  }

  if (!category) {
    return (
      <div className="container-x py-24 text-center">
        <p className="font-display text-3xl font-light">That department doesn't exist.</p>
        <Link href="/categories" className="btn-outline-invert mt-8">All categories</Link>
      </div>
    );
  }

  let items = products.filter((product) => product.category === category.slug);
  if (sort === "price-asc") items = [...items].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
  if (sort === "rating") items = [...items].sort((a, b) => b.rating - a.rating);
  const selectedFilter = items.some((item) => item.id === selectedProductId) ? selectedProductId : "all";
  const visibleItems = selectedFilter === "all" ? items : items.filter((item) => item.id === selectedFilter);

  return (
    <div>
      <div>
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-3 md:hidden">
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
            aria-label={`Cart, ${cartCount} items`}
            data-cart-target
            data-cart-target-priority="2"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"
          >
            <Handbag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        <div className="container-x mx-auto max-w-6xl space-y-5 py-4 md:py-8">
          <div className="relative flex h-32 items-center overflow-hidden rounded-3xl bg-gray-100 px-5 md:h-56 md:px-8">
            <div className="relative z-10 w-[54%]">
              <h1 className="text-xl font-semibold leading-tight">{category.name}</h1>
              <p className="mt-1.5 line-clamp-2 max-w-[150px] text-sm leading-tight text-muted-foreground">
                {category.tagline}
              </p>
              <p className="mt-3 hidden max-w-sm text-sm leading-6 text-muted-foreground md:block">
                {category.description}
              </p>
              <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-medium">
                {items.length} {items.length === 1 ? "product" : "products"}
              </span>
            </div>
            <Image
              src={category.image}
              alt=""
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 767px) 54vw, 620px"
              className="object-contain object-right p-2"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={`${category.name} filters`}>
            <button
              type="button"
              onClick={() => setSelectedProductId("all")}
              aria-pressed={selectedFilter === "all"}
              className={`shrink-0 rounded-3xl px-4 py-2 text-xs transition-colors ${
                selectedFilter === "all"
                  ? "bg-black font-medium text-white"
                  : "bg-white text-neutral-600 hover:text-foreground"
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
                className={`shrink-0 rounded-3xl px-4 py-2 text-xs transition-colors ${
                  selectedFilter === item.id
                    ? "bg-black font-medium text-white"
                    : "bg-white text-neutral-600 hover:text-foreground"
                }`}
              >
                {toTitleCase(item.name)}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Select value={sort} onValueChange={(value) => setSort(value as Sort)}>
              <SelectTrigger className="h-9 w-[150px] rounded-full border-border bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="rating">Top rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "error" ? (
            <p role="alert" className="py-12 text-center text-sm text-destructive">
              {error ?? "The store catalog could not be loaded. Please try again."}
            </p>
          ) : visibleItems.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 pb-6 md:grid-cols-3 lg:grid-cols-4">
              {visibleItems.map((product) => (
                <MobileProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No products in this category yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
