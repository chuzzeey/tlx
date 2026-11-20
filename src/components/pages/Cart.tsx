"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Handbag, Minus, Plus } from "lucide-react";
import { formatPrice, productById } from "@/data/catalog";
import { PageHeader, PageSkeleton } from "@/components/ProductCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useShop, type CartLine } from "@/store/ShopContext";

function QuantitySelector({
  name,
  qty,
  onDecrease,
  onIncrease,
}: {
  name: string;
  qty: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
      <button
        type="button"
        onClick={onDecrease}
        aria-label={`Decrease ${name} quantity`}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300/70 transition-colors hover:border-neutral-400 hover:text-foreground dark:border-neutral-700/70 dark:hover:border-neutral-500"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-4 text-center font-mono2 text-xs">{qty}</span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={`Increase ${name} quantity`}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300/70 transition-colors hover:border-neutral-400 hover:text-foreground dark:border-neutral-700/70 dark:hover:border-neutral-500"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MobileCartHeader({ count }: { count: number }) {
  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <Link
        href="/categories"
        aria-label="Back to categories"
        className="flex h-11 w-11 items-center justify-center"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold">Cart</h1>
      <Link
        href="/cart"
        aria-label={`Shopping bag, ${count} items`}
        data-cart-target
        data-cart-target-priority="2"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100"
      >
        <Handbag className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
            {count}
          </span>
        )}
      </Link>
    </div>
  );
}

function EmptyCart({ count }: { count: number }) {
  return (
    <>
      <MobileCartHeader count={count} />
      <div className="hidden md:block">
        <PageHeader
          kicker="Your selection"
          title="Shopping bag."
          lede="Your TLX Originals selection, ready for the next move."
        />
      </div>
      <section className="container-x flex min-h-[56vh] items-center justify-center py-16 md:min-h-[48vh]">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <Handbag className="h-6 w-6" strokeWidth={1.25} />
          </div>
          <p className="label-mono mt-7">A considered beginning</p>
          <h2 className="mt-4 max-w-lg font-display text-3xl font-light leading-tight sm:text-4xl">
            Your cart is empty.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Discover thoughtful pieces for everyday living, made slowly, chosen well, and kept for years.
          </p>
          <Link href="/categories" className="btn-solid-invert mt-8 rounded-[10px]">
            Browse categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

export default function Cart() {
  const { cart, cartCount, setQty, removeFromCart, clearCart, subtotal, hydrated } = useShop();
  const [openLineId, setOpenLineId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const removalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (removalTimer.current) clearTimeout(removalTimer.current);
  }, []);

  const animateRemoval = (remove: () => void) => {
    if (removalTimer.current) clearTimeout(removalTimer.current);
    setIsRemoving(true);
    remove();
    removalTimer.current = setTimeout(() => {
      setIsRemoving(false);
      removalTimer.current = null;
    }, 300);
  };

  const removeLine = (line: CartLine) => {
    setOpenLineId(null);
    animateRemoval(() => removeFromCart(line.productId, line.color, line.size));
  };

  const decreaseLine = (line: CartLine) => {
    if (line.qty <= 1) {
      removeLine(line);
      return;
    }
    setQty(line.productId, line.qty - 1, line.color, line.size);
  };

  const increaseLine = (line: CartLine, stock: number) => {
    setQty(line.productId, Math.min(stock, line.qty + 1), line.color, line.size);
  };

  const removeAll = () => {
    setOpenLineId(null);
    animateRemoval(clearCart);
  };

  if (!hydrated) return <PageSkeleton />;

  if (cart.length === 0 && !isRemoving) {
    return <EmptyCart count={cartCount} />;
  }

  const shipping = cart.length === 0 || subtotal >= 150 ? 0 : 9;
  const total = subtotal + shipping;

  return (
    <div>
      <MobileCartHeader count={cartCount} />
      <div className="hidden md:block">
        <PageHeader
          kicker="Your selection"
          title="Shopping bag."
          lede="Your TLX Originals selection, ready for the next move."
        />
      </div>
      <div className="container-x grid gap-8 py-5 md:gap-12 md:py-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <div className="space-y-3 md:hidden">
            <AnimatePresence initial={false}>
              {cart.map((line) => {
            const p = productById(line.productId);
            if (!p) return null;
            const lineId = `${line.productId}:${line.color ?? ""}:${line.size ?? ""}`;
            const isOpen = openLineId === lineId;

            return (
              <motion.article
                key={lineId}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="relative overflow-hidden rounded-[22px] bg-transparent"
                onTouchStart={(event) => {
                  touchStartX.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                  const startX = touchStartX.current;
                  const endX = event.changedTouches[0]?.clientX;
                  touchStartX.current = null;
                  if (startX === null || endX === undefined) return;
                  const distance = endX - startX;
                  if (distance < -44) setOpenLineId(lineId);
                  if (distance > 44) setOpenLineId(null);
                }}
              >
                <button
                  type="button"
                  onClick={() => removeLine(line)}
                  aria-label={`Remove ${p.name} from cart`}
                  aria-hidden={!isOpen}
                  tabIndex={isOpen ? 0 : -1}
                  className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-red-100 font-mono2 text-xs tracking-wide text-red-700"
                >
                  remove
                </button>
                <div
                  className={`relative flex min-h-[112px] items-center gap-3 bg-background transition-transform duration-200 ${
                    isOpen ? "-translate-x-20" : ""
                  }`}
                >
                  <Link
                    href={`/products/${p.id}`}
                    className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[20px] bg-neutral-100 dark:bg-neutral-800"
                  >
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="104px"
                      className="object-contain p-2"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col self-stretch py-1.5">
                    <div className="flex min-w-0 items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${p.id}`} className="line-clamp-2 text-[15px] font-semibold leading-tight">
                          {p.name}
                        </Link>
                        {line.size && (
                          <p className="mt-1.5 truncate text-xs text-muted-foreground">Size: {line.size}</p>
                        )}
                        {line.color && (
                          <p className={`${line.size ? "mt-0.5" : "mt-1.5"} truncate text-xs text-muted-foreground`}>
                            Color: {line.color}
                          </p>
                        )}
                      </div>
                      <QuantitySelector
                        name={p.name}
                        qty={line.qty}
                        onDecrease={() => decreaseLine(line)}
                        onIncrease={() => increaseLine(line, p.stock)}
                      />
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <p className="shrink-0 text-base font-semibold">{formatPrice(p.price * line.qty)}</p>
                      <button
                        type="button"
                        onClick={() => removeLine(line)}
                        aria-label={`Remove ${p.name} from cart`}
                        className="shrink-0 py-1 font-mono2 text-xs tracking-wide text-red-600/85 transition-colors hover:text-red-700 dark:text-red-400/85 dark:hover:text-red-300"
                      >
                        remove
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
              })}
            </AnimatePresence>
          </div>

          <div className="hidden space-y-3 md:block">
            <AnimatePresence initial={false}>
              {cart.map((line) => {
                const p = productById(line.productId);
                if (!p) return null;
                const lineId = `${line.productId}:${line.color ?? ""}:${line.size ?? ""}`;
                return (
                  <motion.article
                    key={lineId}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="flex gap-5 overflow-hidden rounded-2xl border border-neutral-200 bg-transparent p-4 dark:border-border"
                  >
                    <Link href={`/products/${p.id}`} className="shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                      <Image src={p.image} alt={p.name} width={128} height={128} className="h-28 w-28 object-contain p-2 sm:h-32 sm:w-32" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link href={`/products/${p.id}`} className="link-underline font-medium">{p.name}</Link>
                          {line.size && (
                            <p className="mt-1 font-mono2 text-[11px] text-muted-foreground">Size: {line.size}</p>
                          )}
                          {line.color && (
                            <p className={`${line.size ? "mt-0.5" : "mt-1"} font-mono2 text-[11px] text-muted-foreground`}>
                              Color: {line.color}
                            </p>
                          )}
                          {p.stock <= 8 && (
                            <p className="mt-1.5 font-mono2 text-[10px] uppercase tracking-[0.15em] text-destructive">
                              Only {p.stock} left in the studio
                            </p>
                          )}
                        </div>
                        <QuantitySelector
                          name={p.name}
                          qty={line.qty}
                          onDecrease={() => decreaseLine(line)}
                          onIncrease={() => increaseLine(line, p.stock)}
                        />
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <p className="font-mono2 text-sm">{formatPrice(p.price * line.qty)}</p>
                        <button
                          type="button"
                          onClick={() => removeLine(line)}
                          aria-label={`Remove ${p.name} from cart`}
                          className="font-mono2 text-xs tracking-wide text-red-600/85 transition-colors hover:text-red-700 dark:text-red-400/85 dark:hover:text-red-300"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
          <div className="flex w-full justify-center pt-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={isRemoving}
                  className="block text-center font-mono2 text-[10px] uppercase tracking-[0.15em] text-destructive/70 underline decoration-destructive/50 underline-offset-4 transition-colors hover:text-destructive"
                >
                  Clear cart
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-0 bg-neutral-100 dark:bg-neutral-900">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-xl font-light">Remove all items?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all products from your cart. You can&apos;t undo this.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-[10px] border-0 bg-transparent shadow-none hover:bg-transparent hover:text-foreground dark:bg-transparent dark:hover:bg-transparent">
                    Keep my cart
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={removeAll}
                    className="rounded-[10px] border border-destructive/25 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                  >
                    Remove all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Summary */}
        <aside>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 dark:border-border dark:bg-muted/40 md:p-7 lg:sticky lg:top-32">
            <p className="font-display text-xl font-light">Your order</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-mono2">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-mono2">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd className="font-mono2">{formatPrice(total)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn-solid-invert mt-7 w-full rounded-[12px]">
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/categories" className="mt-4 block text-center font-mono2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
