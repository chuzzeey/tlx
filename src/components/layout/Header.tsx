"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handbag, Home, LayoutGrid, Search, Store as StoreIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useShop } from "@/store/ShopContext";
import SearchPalette from "@/components/SearchPalette";

/** Number that rolls/pops whenever its value changes. */
function RollingCount({ value }: { value: number }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="inline-block"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

export default function Header() {
  const { cartCount } = useShop();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const isHome = pathname === "/";
  const isProductDetail = pathname.startsWith("/products/");
  const isProductsIndex = pathname === "/products";
  const isCategoryPage = pathname.startsWith("/categories");
  const isCartPage = pathname === "/cart";
  const isCheckoutPage = pathname === "/checkout";
  const isSupportPage = pathname.startsWith("/support");
  const isOrdersPage = pathname === "/orders";

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b border-border backdrop-blur-md ${
          isProductDetail || isProductsIndex || isCategoryPage || isCartPage || isCheckoutPage || isSupportPage || isOrdersPage ? "hidden md:block" : ""
        } ${
          isHome ? "bg-background" : "bg-background/90"
        }`}
      >
        <div className="container-x flex items-center justify-between gap-3 py-4 md:gap-4">
          <Link
            href="/"
            aria-label="TLX Originals, No Hype. Just Motion!"
            className="flex min-w-0 flex-col items-start"
          >
            <span className="brand-type whitespace-nowrap font-display text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              TLX Originals
            </span>
            <span className="mt-0.5 font-mono2 text-[9px] leading-none text-muted-foreground sm:text-[10px]">
              No Hype. Just Motion!
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-4 md:flex lg:gap-6">
            {[
              { href: "/", label: "Home" },
              { href: "/products", label: "Store" },
              { href: "/categories", label: "Category" },
            ].map(({ href, label }) => {
              const active =
                href === "/" ? pathname === "/" :
                href === "/products" ? isProductsIndex :
                isCategoryPage;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`font-mono2 text-xs transition-colors ${
                    active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              title="Search — press / or ⌘K"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground md:h-11 md:w-40 md:justify-start md:gap-3 md:px-4 lg:w-56 xl:w-72 ${
                isHome ? "bg-white" : "bg-neutral-100 dark:bg-muted"
              }`}
            >
              <Search className="h-[18px] w-[18px]" />
              <span className="hidden flex-1 text-left text-sm normal-case tracking-normal md:inline">Search products</span>
              <kbd className="hidden rounded-md bg-background px-2 py-1 font-mono2 text-[9px] text-muted-foreground lg:inline">⌘K</kbd>
            </button>
            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
              title={`Cart${cartCount > 0 ? ` (${cartCount})` : ""}`}
              data-cart-target
              data-cart-target-priority="1"
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground hover:text-background md:h-11 md:w-11 ${
                isHome ? "bg-white" : "bg-neutral-100 dark:bg-muted"
              }`}
            >
              <Handbag className="h-[16px] w-[16px]" />
              {cartCount > 0 && (
                <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 font-mono2 text-[9px] text-white">
                  <RollingCount value={cartCount} />
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <SearchPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />

      <nav
        aria-label="Mobile navigation"
        className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border pb-[env(safe-area-inset-bottom)] backdrop-blur-md ${
          isProductDetail || isCartPage || isCheckoutPage || isOrdersPage ? "hidden" : "md:hidden"
        } ${
          isHome ? "bg-background" : "bg-background/95"
        }`}
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 font-mono2 text-[10px] transition-colors ${
            pathname === "/" ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {pathname === "/" ? (
            <svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M2.8 10.25 12 3l9.2 7.25v9.1A1.65 1.65 0 0 1 19.55 21H4.45a1.65 1.65 0 0 1-1.65-1.65v-9.1Z"
              />
              <path fill="hsl(var(--background))" d="M9 21v-7h6v7z" />
            </svg>
          ) : (
            <Home className="h-[18px] w-[18px]" />
          )}
          Home
        </Link>
        <Link
          href="/products"
          aria-current={isProductsIndex ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 font-mono2 text-[10px] transition-colors ${
            isProductsIndex ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <StoreIcon className={`h-[18px] w-[18px] ${isProductsIndex ? "fill-current" : ""}`} />
          Store
        </Link>
        <Link
          href="/categories"
          aria-current={pathname.startsWith("/categories") ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 font-mono2 text-[10px] transition-colors ${
            pathname.startsWith("/categories") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <LayoutGrid className={`h-[18px] w-[18px] ${pathname.startsWith("/categories") ? "fill-current" : ""}`} />
          Category
        </Link>
        <Link
          href="/cart"
          aria-label={`Cart, ${cartCount} items`}
          data-cart-target
          data-cart-target-priority="0"
          aria-current={pathname === "/cart" ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 font-mono2 text-[10px] transition-colors ${
            pathname === "/cart" ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <span className="relative">
            <Handbag className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span aria-hidden="true" className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono2 text-[9px] text-white">
                <RollingCount value={cartCount} />
              </span>
            )}
          </span>
          Cart
        </Link>
      </nav>
    </>
  );
}
