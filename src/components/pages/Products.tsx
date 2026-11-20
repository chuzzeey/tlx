"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cardReviewCount, categories, categoryName, formatPrice, products, type Product } from "@/data/catalog";
import AddToCartButton from "@/components/AddToCartButton";
import ProductFavoriteButton from "@/components/ProductFavoriteButton";
import { EASE } from "@/components/motion/motion";
import { Aster } from "@/components/Ornaments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

type Sort = "mixed" | "featured" | "price-asc" | "price-desc" | "rating" | "name";

const MAX_PRICE = 1000;

function Filters({
  selected,
  toggleCategory,
  priceCap,
  setPriceCap,
}: {
  selected: string[];
  toggleCategory: (slug: string) => void;
  priceCap: number;
  setPriceCap: (n: number) => void;
}) {
  return (
    <div className="space-y-10">
      <div>
        <p className="label-mono mb-4">Category</p>
        <ul className="space-y-2.5">
          {categories.map((c) => {
            const active = selected.includes(c.slug);
            const count = products.filter((p) => p.category === c.slug).length;
            return (
              <li key={c.slug}>
                <button
                  onClick={() => toggleCategory(c.slug)}
                  className={`flex w-full items-center justify-between text-left text-sm transition-colors ${
                    active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 border transition-colors ${
                        active ? "border-foreground bg-foreground" : "border-border"
                      }`}
                    />
                    {c.name}
                  </span>
                  <span className="font-mono2 text-[10px]">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="label-mono mb-4">Max price — {formatPrice(priceCap)}</p>
        <Slider
          value={[priceCap]}
          onValueChange={([v]) => setPriceCap(v)}
          min={30}
          max={MAX_PRICE}
          step={10}
        />
        <div className="mt-2 flex justify-between font-mono2 text-[10px] text-muted-foreground">
          <span>{formatPrice(30)}</span>
          <span>{formatPrice(MAX_PRICE)}</span>
        </div>
      </div>
      <div>
        <p className="label-mono mb-4">Availability</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Explore the latest jackets, T-shirts, shoes, bags, and accessories from TLX Originals.
        </p>
      </div>
    </div>
  );
}

function interleaveByCategory(items: Product[]) {
  const groups = [...new Set(items.map((product) => product.category))].map((category) =>
    items.filter((product) => product.category === category)
  );
  const mixed: Product[] = [];

  for (let index = 0; mixed.length < items.length; index += 1) {
    for (const group of groups) {
      if (group[index]) mixed.push(group[index]);
    }
  }

  return mixed;
}

function StoreProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.025, 0.2), ease: EASE }}
      className="group min-w-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f5f5f5] dark:bg-[#242424]">
        <Link href={`/products/${product.id}`} className="absolute inset-x-0 bottom-12 top-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={index < 2}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        {product.badge && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-foreground px-2.5 py-1 font-mono2 text-[9px] uppercase tracking-[0.15em] text-background">
            {product.badge}
          </span>
        )}
        <ProductFavoriteButton product={product} />
        <AddToCartButton product={product} className="absolute bottom-2.5 left-3 right-3 z-10" />
      </div>
      <div className="pt-3">
        <p className="label-mono">{categoryName(product.category)}</p>
        <Link href={`/products/${product.id}`} className="mt-1 block">
          <h2 className="min-h-6 truncate text-sm font-medium leading-6 sm:text-base">{product.name}</h2>
        </Link>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-[#FFC107] text-[#D99700]" aria-hidden="true" />
          <span className="text-foreground">{product.rating.toFixed(1)}</span>
          <span>({cardReviewCount(product).toLocaleString()} reviews)</span>
        </div>
        <p className="mt-2 text-sm font-medium">{formatPrice(product.price)}</p>
      </div>
    </motion.article>
  );
}

export default function Products() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("mixed");
  const [priceCap, setPriceCap] = useState(MAX_PRICE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const mixedProducts = useMemo(() => interleaveByCategory(products), []);

  const toggleCategory = (slug: string) =>
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const filtered = useMemo(() => {
    let list = mixedProducts.filter(
      (p) =>
        p.price <= priceCap &&
        (selected.length === 0 || selected.includes(p.category)) &&
        (query.trim() === "" ||
          (p.name + " " + p.description + " " + p.sku).toLowerCase().includes(query.toLowerCase()))
    );
    switch (sort) {
      case "mixed": break;
      case "featured": list = [...list].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false)); break;
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "rating": list = [...list].sort((a, b) => b.rating - a.rating); break;
      case "name": list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [mixedProducts, query, selected, sort, priceCap]);

  const clearFilters = () => {
    setQuery("");
    setSelected([]);
    setPriceCap(MAX_PRICE);
    setSort("mixed");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-center border-b border-border bg-background md:hidden">
        <Link
          href="/"
          aria-label="Back to home"
          className="absolute left-3 flex h-11 w-11 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-sm font-semibold">Store</h1>
      </div>

      <section className="border-b border-border">
        <div className="container-x py-8 md:py-12">
          <p className="label-mono">TLX Originals · A considered edit</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="font-display text-4xl font-light tracking-tight sm:text-5xl md:text-6xl">The Store</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                A mixed edit of everyday layers, shoes, bags, and the details that finish an outfit.
              </p>
            </div>
            <p className="label-mono mb-1 flex items-center gap-2">
              <Aster className="h-3 w-3 text-primary" />
              {products.length} pieces
            </p>
          </div>
        </div>
      </section>

      <main className="container-x mx-auto max-w-[1600px] py-7 md:py-10">
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
          <button
            type="button"
            onClick={() => setSelected([])}
            aria-pressed={selected.length === 0}
            className={`shrink-0 rounded-full px-4 py-2 text-xs transition-colors ${
              selected.length === 0
                ? "bg-foreground text-background"
                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {categories.map((category) => {
            const active = selected.includes(category.slug);
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => toggleCategory(category.slug)}
                aria-pressed={active}
                className={`shrink-0 rounded-full px-4 py-2 text-xs transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/80"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 md:flex md:items-center">
          <div className="relative col-span-2 min-w-0 md:flex-1">
            <label htmlFor="store-search" className="sr-only">Search store</label>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="store-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the store…"
              className="input-plain rounded-full bg-card pl-10"
            />
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <button type="button" className="btn-outline-invert w-full rounded-full px-4 md:w-auto">
                <SlidersHorizontal className="h-4 w-4" />
                Filters{selected.length > 0 ? ` · ${selected.length}` : ""}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] overflow-y-auto border-l border-border bg-background p-6">
              <p className="mb-6 font-display text-2xl font-light">Refine the edit</p>
              <Filters selected={selected} toggleCategory={toggleCategory} priceCap={priceCap} setPriceCap={setPriceCap} />
            </SheetContent>
          </Sheet>
          <Select value={sort} onValueChange={(value) => setSort(value as Sort)}>
            <SelectTrigger className="w-full rounded-full border-border bg-card font-mono2 text-xs uppercase tracking-wider md:w-[190px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="mixed">Mixed edit</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: low → high</SelectItem>
              <SelectItem value="price-desc">Price: high → low</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
          <span className="col-span-2 flex items-center justify-end gap-2 font-mono2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:col-span-1 md:ml-auto">
            <Aster className="h-3 w-3 text-primary" />
            {filtered.length} of {products.length} pieces
          </span>
        </div>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="rounded-2xl border border-dashed border-border py-20 text-center"
            >
              <p className="font-display text-2xl font-light">Nothing matches this edit.</p>
              <p className="mt-3 text-sm text-muted-foreground">Try widening the price range or clearing your filters.</p>
              <button type="button" onClick={clearFilters} className="btn-outline-invert mt-6 rounded-full">
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 md:gap-y-10 xl:grid-cols-4 xl:gap-x-8"
            >
              {filtered.map((product, index) => (
                <StoreProductCard key={product.id} product={product} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
