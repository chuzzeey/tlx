"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handbag, Heart, Home, LayoutGrid, MessageCircleMore, Moon, Search, Sun, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/store/ThemeContext";
import { useShop } from "@/store/ShopContext";
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

const nav = [
  { to: "/products", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/content", label: "Journal" },
  { to: "/support", label: "Support" },
];

export default function Header() {
  const { theme, toggle } = useTheme();
  const { cartCount, wishlist } = useShop();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header
        className={`sticky top-0 z-50 border-b border-border backdrop-blur-md ${
          isHome ? "bg-white dark:bg-background" : "bg-background/90"
        }`}
      >
        <div className="container-x flex items-center justify-between gap-6 py-4">
          <div className="flex items-end gap-5">
            <Link href="/" className="brand-type font-display text-3xl font-medium tracking-tight">
              Aurelle<span className="text-primary">.</span>
            </Link>
            <p className="mb-1 hidden max-w-[220px] font-mono2 text-[10px] leading-relaxed text-muted-foreground lg:block">
              Considered goods for modern living — made slowly, kept for decades.
            </p>
          </div>

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
              onClick={() => setSearchOpen(true)}
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
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-neutral-100 text-foreground transition-colors hover:bg-foreground hover:text-background dark:bg-muted md:h-10 md:w-auto md:gap-2 md:rounded-none md:px-3"
            >
              <Handbag className="h-[16px] w-[16px]" />
              <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 font-mono2 text-[9px] text-white md:hidden">
                <RollingCount value={13} />
              </span>
              <span className="hidden overflow-hidden font-mono2 text-xs md:inline">
                <RollingCount value={cartCount} />
              </span>
            </Link>
          </div>
        </div>
        <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </header>

      <nav
        aria-label="Mobile navigation"
        className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden ${
          isHome ? "bg-white dark:bg-background" : "bg-background/95"
        }`}
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 font-mono2 text-[10px] transition-colors ${
            pathname === "/" ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Home className="h-[18px] w-[18px]" />
          Home
        </Link>
        <Link
          href="/categories"
          aria-current={pathname.startsWith("/categories") ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 font-mono2 text-[10px] transition-colors ${
            pathname.startsWith("/categories") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <LayoutGrid className="h-[18px] w-[18px]" />
          Category
        </Link>
        <Link
          href="/wishlist"
          aria-current={pathname === "/wishlist" ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 font-mono2 text-[10px] transition-colors ${
            pathname === "/wishlist" ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Heart className="h-[18px] w-[18px]" />
          Favorite
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
            <User className="h-[18px] w-[18px]" />
            My Profile
          </button>
        </SheetTrigger>
      </nav>

      <SheetContent side="right" className="w-[300px] border-l border-border bg-background p-0">
        <div className="flex items-center justify-between border-b border-border p-5">
          <span className="brand-type font-display text-xl">Aurelle.</span>
          <button onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col">
          <button
            onClick={() => {
              setOpen(false);
              setSearchOpen(true);
            }}
            className="flex items-center gap-2 border-b border-border px-5 py-4 text-left font-mono2 text-xs uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-muted"
          >
            <Search className="h-3.5 w-3.5" /> Search
          </button>
          {[...nav, { to: "/account", label: "Account" }, { to: "/wishlist", label: "Wishlist" }, { to: "/cart", label: "Bag" }].map((n) => (
            <Link
              key={n.to}
              href={n.to}
              onClick={() => setOpen(false)}
              className="border-b border-border px-5 py-4 font-mono2 text-xs uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-muted"
            >
              {n.label}
            </Link>
          ))}
          <button
            onClick={toggle}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="flex items-center justify-between border-b border-border px-5 py-4 font-mono2 text-xs uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-muted"
          >
            <span>Theme</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === "light" ? "Dark mode" : "Light mode"}
            </span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
