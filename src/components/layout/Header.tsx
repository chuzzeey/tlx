"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handbag, Home, LayoutGrid, Moon, Search, Store as StoreIcon, Sun, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useShop } from "@/store/ShopContext";
import { useTheme } from "@/store/ThemeContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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

const profileMenuItems = [
  { to: "/products", label: "Store", icon: StoreIcon },
  { to: "/categories", label: "Category", icon: LayoutGrid },
  { to: "/cart", label: "Cart", icon: Handbag },
];

export default function Header() {
  const { cartCount } = useShop();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const isHome = pathname === "/";
  const isProductDetail = pathname.startsWith("/products/");
  const isProductsIndex = pathname === "/products";
  const isCategoryPage = pathname.startsWith("/categories");
  const isCartPage = pathname === "/cart";
  const isCheckoutPage = pathname === "/checkout";
  const isAccountPage = pathname === "/account";
  const isSupportPage = pathname.startsWith("/support");
  const isOrdersPage = pathname === "/orders";
  const isLoginPage = pathname === "/login";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header
        className={`sticky top-0 z-50 border-b border-border backdrop-blur-md ${
          isProductDetail || isProductsIndex || isCategoryPage || isCartPage || isCheckoutPage || isAccountPage || isSupportPage || isOrdersPage || isLoginPage ? "hidden md:block" : ""
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
            <Link
              href="/account"
              aria-current={isAccountPage || isLoginPage ? "page" : undefined}
              className={`font-mono2 text-xs transition-colors ${
                isAccountPage || isLoginPage ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Profile
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              title="Search — press / or ⌘K"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-neutral-100 text-muted-foreground transition-colors hover:text-foreground dark:bg-muted md:h-11 md:w-40 md:justify-start md:gap-3 md:px-4 lg:w-56 xl:w-72"
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
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-neutral-100 text-foreground transition-colors hover:bg-foreground hover:text-background dark:bg-muted md:h-11 md:w-11"
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
        className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border pb-[env(safe-area-inset-bottom)] backdrop-blur-md ${
          isProductDetail || isCartPage || isCheckoutPage || isAccountPage || isOrdersPage || isLoginPage ? "hidden" : "md:hidden"
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
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="My Profile"
            aria-current={pathname === "/account" ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 font-mono2 text-[10px] transition-colors ${
              pathname === "/account" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <User className={`h-[18px] w-[18px] ${pathname === "/account" ? "fill-current" : ""}`} />
            My Profile
          </button>
        </SheetTrigger>
      </nav>

      <SheetContent side="right" className="flex h-full w-[320px] flex-col border-l border-border bg-background p-0">
        <div className="flex items-center justify-between border-b border-border p-5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            aria-label="TLX Originals home"
            className="brand-type font-display text-xl font-bold"
          >
            TLX Originals
          </Link>
          <button onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Profile menu" className="px-5 pt-6">
          <div className="mb-7">
            <p className="label-mono mb-3">Theme</p>
            <div
              role="group"
              aria-label="Color theme"
              className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/40 p-1"
            >
              <button
                type="button"
                aria-pressed={theme === "light"}
                onClick={() => {
                  if (theme !== "light") toggle();
                }}
                className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm transition-colors ${
                  theme === "light"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                type="button"
                aria-pressed={theme === "dark"}
                onClick={() => {
                  if (theme !== "dark") toggle();
                }}
                className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm transition-colors ${
                  theme === "dark"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {profileMenuItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                to === "/products" ? isProductsIndex :
                to === "/categories" ? isCategoryPage :
                isCartPage;

              return (
                <Link
                  key={to}
                  href={to}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={to === "/cart" ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : undefined}
                  className="flex items-center justify-between py-4 transition-colors hover:text-muted-foreground"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="font-display text-xl font-light tracking-tight">{label}</span>
                  </span>
                  {to === "/cart" && cartCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 font-mono2 text-[10px] text-white"
                    >
                      <RollingCount value={cartCount} />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="mt-auto border-t border-border px-5 py-4">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 py-3 text-sm transition-colors hover:text-muted-foreground"
          >
            <User className="h-4 w-4" />
            My account
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center border-t border-border pt-4 font-mono2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
