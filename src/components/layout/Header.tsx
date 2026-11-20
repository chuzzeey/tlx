"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Handbag, Heart, Home, LayoutGrid, MessageCircleMore, Moon, Search, Sun, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/store/ThemeContext";
import { useShop } from "@/store/ShopContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SearchPalette from "@/components/SearchPalette";
import { recommendedItems, shuffleRecommendations } from "@/data/searchRecommendations";

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

const nav = [
  { to: "/products", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/content", label: "Journal" },
  { to: "/support", label: "Support" },
];

const profileMenuItems = [
  { to: "/categories", label: "Categories" },
  { to: "/support", label: "Help centre" },
];

export default function Header() {
  const { theme, toggle } = useTheme();
  const { cartCount, wishlist } = useShop();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recommendations, setRecommendations] = useState(recommendedItems);
  const handleSearchOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen && !searchOpen) {
      setRecommendations((previousOrder) => shuffleRecommendations(recommendedItems, previousOrder));
    }
    setSearchOpen(nextOpen);
  }, [searchOpen]);
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
        <div className="container-x flex items-center justify-between gap-6 py-4">
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

          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((n) => {
              const isActive = pathname === n.to || pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  href={n.to}
                  className={`link-underline font-mono2 text-xs uppercase tracking-[0.18em] transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSearchOpenChange(true)}
              aria-label="Search"
              title="Search — press / or ⌘K"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-neutral-100 text-muted-foreground transition-colors hover:text-foreground dark:bg-muted sm:h-10 sm:w-auto sm:rounded-none sm:border sm:bg-transparent dark:sm:bg-transparent sm:px-3"
            >
              <Search className="h-[18px] w-[18px]" />
              <span className="hidden font-mono2 text-[11px] uppercase tracking-[0.15em] lg:inline">Search</span>
              <kbd className="hidden border border-border px-1 py-0.5 font-mono2 text-[9px] text-muted-foreground lg:inline">⌘K</kbd>
            </button>
            <Link
              href="/support/contact"
              aria-label="Messages, 2 unread"
              title="Messages"
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-neutral-100 text-muted-foreground transition-colors hover:text-foreground dark:bg-muted md:hidden"
            >
              <MessageCircleMore className="h-[18px] w-[18px]" />
              <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono2 text-[9px] text-white ring-2 ring-background">
                2
              </span>
            </Link>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="hidden h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:flex"
            >
              {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
            </button>
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative hidden h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:flex"
            >
              <Heart className="h-[18px] w-[18px]" />
              {wishlist.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center overflow-hidden bg-primary font-mono2 text-[9px] text-primary-foreground">
                  <RollingCount value={wishlist.length} />
                </span>
              )}
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className={`hidden h-10 w-10 items-center justify-center transition-colors md:flex ${
                pathname === "/account" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/cart"
              aria-label={`Shopping bag, ${cartCount} items`}
              data-cart-target
              data-cart-target-priority="1"
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-neutral-100 text-foreground transition-colors hover:bg-foreground hover:text-background dark:bg-muted md:h-10 md:w-auto md:gap-2 md:rounded-none md:px-3"
            >
              <Handbag className="h-[16px] w-[16px]" />
              {cartCount > 0 && (
                <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 font-mono2 text-[9px] text-white md:hidden">
                  <RollingCount value={cartCount} />
                </span>
              )}
              <span className="hidden overflow-hidden font-mono2 text-xs md:inline">
                <RollingCount value={cartCount} />
              </span>
            </Link>
          </div>
        </div>
      </header>
      <SearchPalette
        open={searchOpen}
        onOpenChange={handleSearchOpenChange}
        recommendations={recommendations}
      />

      <nav
        aria-label="Mobile navigation"
        className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border pb-[env(safe-area-inset-bottom)] backdrop-blur-md ${
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
          <div className="divide-y divide-border border-y border-border">
            {profileMenuItems.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between py-5 transition-colors hover:text-muted-foreground"
              >
                <span className="font-display text-xl font-light tracking-tight">{item.label}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
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
            className="mt-2 flex items-center justify-between border-t border-border pt-4 font-mono2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
