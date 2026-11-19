"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import Image from "next/image";
import { formatPrice, products } from "@/data/catalog";
import { EASE } from "@/components/motion/motion";

const itemCls =
  "mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm transition-colors aria-selected:bg-neutral-100 dark:aria-selected:bg-muted";
const recommendedProducts = [
  ...products.filter((product) => product.category === "jackets"),
  ...products.filter((product) => product.featured && product.category !== "jackets"),
].slice(0, 4);

export default function SearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const go = (to: string) => {
    setQuery("");
    onOpenChange(false);
    router.push(to);
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
            className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <div className="container-x pointer-events-none relative flex justify-center pt-[8vh] sm:pt-[10vh]">
            <motion.div
              className="pointer-events-auto w-full max-w-2xl"
              initial={{ opacity: 0, y: -8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <Command
                label="Site search"
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
                  <p className="px-5 pb-2 pt-1 text-xs font-medium text-muted-foreground">Recommended</p>
                )}
                <Command.List className="max-h-[52vh] overflow-y-auto border-t border-border/70 px-1 pb-2">
                  <Command.Empty className="px-4 py-12 text-center">
                    <p className="text-sm text-muted-foreground">No products found. Try another search.</p>
                  </Command.Empty>

                    {(query.trim() ? products : recommendedProducts).map((p) => (
                      <Command.Item
                        key={p.id}
                        value={`${p.name} ${p.sku} ${p.category}`}
                        onSelect={() => go(`/products/${p.id}`)}
                        className={itemCls}
                      >
                        <Image
                          src={p.image}
                          alt=""
                          width={48}
                          height={60}
                          className="h-[60px] w-12 shrink-0 rounded-lg object-cover"
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                        <span className="shrink-0 whitespace-nowrap text-sm font-medium">{formatPrice(p.price)}</span>
                      </Command.Item>
                    ))}
                </Command.List>
              </Command>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
