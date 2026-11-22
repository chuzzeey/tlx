"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Clock3, Search, SlidersHorizontal, Star, X } from "lucide-react";
import Image from "next/image";
import { cardReviewCount } from "@/data/catalog";
import { useCatalog } from "@/store/CatalogContext";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";
import { EASE } from "@/components/motion/motion";
import { toast } from "sonner";

type SearchItem = {
  id: string;
  name: string;
  category: string;
  image: string;
  href: string;
  rating: number;
  reviewCount: number;
  price: number;
};

const itemCls =
  "mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm transition-colors aria-selected:bg-neutral-100 dark:aria-selected:bg-muted";
const SEARCH_HISTORY_KEY = "tlx-search-history";
const MAX_SEARCH_HISTORY = 5;

export default function SearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { products } = useCatalog();
  const { formatPrice } = useStorefrontCurrency();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchHistoryLoaded, setSearchHistoryLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Load persisted browser state after mount to keep server markup stable.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRecentSearches(parsed.filter((term): term is string => typeof term === "string").slice(0, MAX_SEARCH_HISTORY));
        }
      }
    } catch {
      toast.error("Recent searches couldn't be loaded.");
    } finally {
      setSearchHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!searchHistoryLoaded) return;
    try {
      window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(recentSearches));
    } catch {
      toast.error("Recent searches couldn't be saved.");
    }
  }, [recentSearches, searchHistoryLoaded]);

  /* Global shortcuts: ⌘K / Ctrl+K toggles, "/" opens, Esc closes */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          setQuery("");
          onOpenChange(false);
        } else {
          onOpenChange(true);
        }
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        onOpenChange(true);
      } else if (e.key === "Escape" && open) {
        setQuery("");
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const mobile = window.matchMedia("(max-width: 767px)").matches;
        (mobile ? mobileInputRef : inputRef).current?.focus();
      });
    }
  }, [open]);

  const matchedProducts = query.trim()
    ? products.filter((product) =>
        `${product.name} ${product.category} ${product.description}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      )
    : [];
  const displayedProducts: SearchItem[] = matchedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    image: product.image,
    href: `/products/${product.id}`,
    rating: product.rating,
    reviewCount: cardReviewCount(product),
    price: product.price,
  }));

  const go = (to: string) => {
    recordSearch(query);
    setQuery("");
    onOpenChange(false);
    router.push(to);
  };

  const recordSearch = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    setRecentSearches((previous) =>
      [normalized, ...previous.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, MAX_SEARCH_HISTORY)
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            aria-label="Close search"
            onClick={() => {
              setQuery("");
              onOpenChange(false);
            }}
            className="absolute inset-0 bg-background md:bg-foreground/30 md:backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <div className="relative flex h-full justify-center md:mx-auto md:w-full md:max-w-[1400px] md:px-6 lg:px-10 md:pointer-events-none md:pt-[8vh] lg:pt-[10vh]">
            <motion.div
              className="pointer-events-auto flex h-full w-full flex-col md:block md:h-auto md:max-w-2xl"
              initial={{ opacity: 0, y: -8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <div className="flex items-center gap-3 border-b border-border bg-background px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] md:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    onOpenChange(false);
                  }}
                  aria-label="Back"
                  className="flex h-10 w-9 shrink-0 items-center justify-center"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-neutral-100 px-4">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    ref={mobileInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products"
                    aria-label="Search products"
                    className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => go("/products")}
                    aria-label="Browse product filters"
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </button>
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <section className="flex h-[calc(100dvh-89px)] min-h-0 flex-col overflow-y-auto bg-background px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
                {!query.trim() && recentSearches.length > 0 && (
                  <div className="shrink-0">
                    <div className="flex items-center justify-between gap-3 py-4">
                      <h2 className="text-base font-semibold">Recent Search</h2>
                      <button
                        type="button"
                        onClick={() => setRecentSearches([])}
                        className="text-sm text-muted-foreground"
                      >
                        Clear All
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {recentSearches.map((term) => (
                        <li key={term} className="flex min-w-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuery(term)}
                            className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left text-sm text-muted-foreground"
                          >
                            <Clock3 className="h-5 w-5 shrink-0" />
                            <span className="truncate">{term}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecentSearches((previous) => previous.filter((item) => item !== term))}
                            aria-label={`Remove ${term} from recent searches`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">
                      {query.trim() ? `Results for ${query.trim()}` : "Search six TLX pieces"}
                    </h2>
                  </div>
                  {query.trim() ? (
                    <span className="shrink-0 text-sm text-muted-foreground">{displayedProducts.length} Products</span>
                  ) : (
                    <span className="shrink-0 text-sm text-muted-foreground">Search to browse</span>
                  )}
                </div>
                {displayedProducts.length ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-5 pb-6">
                    {displayedProducts.map((item) => {
                      return (
                        <article key={item.id} className="min-w-0">
                          <div className="group relative">
                            <Link
                              href={item.href}
                              onClick={() => {
                                recordSearch(query);
                                setQuery("");
                                onOpenChange(false);
                              }}
                              className="relative block aspect-square overflow-hidden rounded-2xl bg-neutral-100"
                            >
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="(max-width: 767px) 50vw, 360px"
                                className="object-contain p-2"
                              />
                            </Link>
                          </div>
                          <Link
                            href={item.href}
                            onClick={() => {
                              recordSearch(query);
                              setQuery("");
                              onOpenChange(false);
                            }}
                            className="mt-3 block truncate text-sm font-medium"
                          >
                            {item.name}
                          </Link>
                          {item.rating !== undefined && item.price !== undefined && (
                            <>
                              <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs">
                                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" aria-hidden="true" />
                                <span className="shrink-0">{item.rating.toFixed(1)}</span>
                                {item.reviewCount !== undefined && (
                                  <span className="truncate text-muted-foreground">
                                    ({item.reviewCount.toLocaleString()} Reviews)
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-base font-semibold">{formatPrice(item.price)}</p>
                            </>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    {query.trim() ? "No products found. Try another search." : "Search by product name or category."}
                  </p>
                )}
              </section>

              <div className="hidden md:block">
              <Command
                label="Site search"
                shouldFilter={false}
                className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_30px_90px_-28px_rgba(0,0,0,0.4)] dark:bg-background"
              >
                <div className="flex items-center justify-between px-5 pt-5">
                  <p className="text-base font-semibold tracking-tight">Search</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      onOpenChange(false);
                    }}
                    aria-label="Close search"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-muted-foreground transition-colors hover:bg-neutral-200 dark:bg-muted dark:hover:bg-muted/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mx-5 my-4 flex items-center gap-3 rounded-2xl border border-border bg-neutral-50 px-4 dark:bg-muted">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <Command.Input
                    ref={inputRef}
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search products…"
                    className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
                  />
                  <kbd className="hidden shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-medium text-muted-foreground sm:block dark:bg-background">
                    Esc
                  </kbd>
                </div>

                {!query.trim() && (
                <p className="px-5 pb-2 pt-1 text-xs font-medium text-muted-foreground">
                  Search the six current pieces
                </p>
                )}
                <Command.List className="max-h-[52vh] overflow-y-auto border-t border-border/70 px-1 pb-2">
                  <Command.Empty className="px-4 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      {query.trim() ? "No products found. Try another search." : "Search by product name or category."}
                    </p>
                  </Command.Empty>

                    {displayedProducts.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.name} ${item.category}`}
                        onSelect={() => go(item.href)}
                        className={itemCls}
                      >
                        <Image
                          src={item.image}
                          alt=""
                          width={48}
                          height={60}
                          className="h-[60px] w-12 shrink-0 rounded-lg object-cover"
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                        {item.rating !== undefined && (
                          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                            {item.rating.toFixed(1)}
                            {item.reviewCount !== undefined && (
                              <span>({item.reviewCount.toLocaleString()} reviews)</span>
                            )}
                          </span>
                        )}
                        {item.price !== undefined && (
                          <span className="shrink-0 whitespace-nowrap text-sm font-medium">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </Command.Item>
                    ))}
                </Command.List>
              </Command>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
