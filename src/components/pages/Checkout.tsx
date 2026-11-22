"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CreditCard, Handbag, Lock, PackageCheck, ShoppingCart } from "lucide-react";
import { Barcode, Stamp } from "@/components/Ornaments";
import { AnimatePresence, motion } from "framer-motion";
import {
  EXPRESS_SHIPPING_FEE_NGN,
  FREE_SHIPPING_THRESHOLD_NGN,
  STANDARD_SHIPPING_FEE_NGN,
  WHITE_GLOVE_SHIPPING_FEE_NGN,
} from "@/data/catalog";
import { useCatalog } from "@/store/CatalogContext";
import { PageSkeleton } from "@/components/ProductCard";
import { isProductInStock } from "@/lib/product-availability";
import { EASE } from "@/components/motion/motion";
import { useShop } from "@/store/ShopContext";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";
import { toast } from "sonner";
import CountryRegionPicker from "@/components/checkout/CountryRegionPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Form {
  email: string; name: string; phone: string; street: string; city: string; country: string; region: string;
  delivery: string; card: string; expiry: string; cvc: string; nameOnCard: string; notes: string;
}

const initial: Form = {
  email: "", name: "", phone: "", street: "", city: "", country: "Nigeria", region: "",
  delivery: "standard", card: "", expiry: "", cvc: "", nameOnCard: "", notes: "",
};

const deliveryOptions = [
  { id: "standard", name: "Standard courier", eta: "3–5 business days", price: 0 },
  { id: "express", name: "Express courier", eta: "1–2 business days", price: EXPRESS_SHIPPING_FEE_NGN },
  { id: "whiteglove", name: "White-glove (furniture)", eta: "Scheduled with you", price: WHITE_GLOVE_SHIPPING_FEE_NGN },
];

function CheckoutHeader({ count }: { count: number }) {
  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <Link href="/cart" aria-label="Back to cart" className="flex h-11 w-11 items-center justify-center">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold">Checkout</h1>
      <Link
        href="/cart"
        aria-label={`Cart, ${count} items`}
        data-cart-target
        data-cart-target-priority="2"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-muted"
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

export default function Checkout() {
  const router = useRouter();
  const { products } = useCatalog();
  const { cart, cartCount, subtotal, clearCart, hydrated } = useShop();
  const { formatPrice } = useStorefrontCurrency();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initial);
  const [placed, setPlaced] = useState<string | null>(null);
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false);

  const delivery = deliveryOptions.find((d) => d.id === form.delivery)!;
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_NGN;
  const shipping = cart.length === 0
    ? 0
    : qualifiesForFreeShipping && delivery.id !== "whiteglove"
      ? delivery.price
      : delivery.price + (qualifiesForFreeShipping ? 0 : STANDARD_SHIPPING_FEE_NGN);
  const total = subtotal + shipping;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canContinue = useMemo(() => {
    if (step === 1) {
      return Boolean(
        form.email.includes("@") &&
        form.name.trim() &&
        form.phone.trim() &&
        form.street.trim() &&
        form.city.trim() &&
        form.country.trim() &&
        form.region.trim()
      );
    }
    if (step === 3) return form.card.replace(/\s/g, "").length >= 12 && form.expiry.length >= 4 && form.cvc.length >= 3 && form.nameOnCard;
    return true;
  }, [step, form]);

  if (placed) {
    return (
      <div className="container-x relative flex flex-col items-center py-24 text-center">
        <Stamp
          text="Received · TLX Originals · "
          className="absolute right-2 top-4 h-20 w-20 rotate-12 text-muted-foreground/50 sm:right-10"
        />
        <motion.span
          className="flex h-16 w-16 items-center justify-center border border-foreground"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <PackageCheck className="h-7 w-7" strokeWidth={1.5} />
        </motion.span>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          className="flex flex-col items-center"
        >
        <p className="label-mono mt-8">Order confirmed</p>
        <h1 className="mt-4 font-display text-4xl font-light sm:text-5xl">Thank you, {form.name}.</h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Order <span className="font-mono2 text-foreground">{placed}</span> is being prepared by TLX Originals.
          A confirmation is on its way to <span className="text-foreground">{form.email}</span>, and tracking
          will follow within 48 hours.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2 text-foreground/70">
          <Barcode code={placed} className="h-8 w-44" />
          <span className="font-mono2 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
            {placed} · TLX Originals
          </span>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/account" className="btn-solid-invert">Track in your account</Link>
          <Link href="/products" className="btn-outline-invert">Keep browsing</Link>
        </div>
        </motion.div>
      </div>
    );
  }

  if (!hydrated) return <PageSkeleton rows={2} />;

  if (cart.length === 0) {
    return (
      <>
        <CheckoutHeader count={cartCount} />
        <div className="container-x flex flex-col items-center py-24 text-center">
          <h2 className="font-display text-3xl font-light">Nothing to check out yet.</h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">Your bag is empty. Add a few considered pieces first.</p>
          <Link href="/categories" className="btn-outline-invert mt-8 rounded-[12px]">Browse categories</Link>
        </div>
      </>
    );
  }

  const unavailableItems = cart.filter((line) => {
    const product = products.find((candidate) => candidate.id === line.productId);
    return !product || !isProductInStock(product) || product.stock < line.qty;
  });
  if (unavailableItems.length > 0) {
    return (
      <div className="container-x flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="font-display text-3xl font-light">Your cart needs an update.</h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Some products are no longer available or have less stock than requested. Review your cart before continuing.
        </p>
        <Link href="/cart" className="btn-outline-invert mt-8">Review cart</Link>
      </div>
    );
  }

  const placeOrder = () => {
    const id = `AUR-${Math.floor(1043 + Math.random() * 800)}`;
    clearCart();
    setPlaced(id);
    toast.success("Order placed", { description: `Order ${id} confirmed.` });
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <div>
      <CheckoutHeader count={cartCount} />
      <div className="container-x mx-auto max-w-4xl py-8 md:py-12">
        <div>
          {/* Step 0: order review */}
          <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
          {step === 0 && (
            <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50/70 dark:border-border dark:bg-muted/40">
              <div className="border-b border-neutral-200 px-5 py-5 dark:border-border sm:px-7">
                <p className="label-mono text-center">Order summary</p>
              </div>
              <ul className="divide-y divide-neutral-200 px-5 dark:divide-border sm:px-7">
                {cart.map((line) => {
                  const p = products.find((product) => product.id === line.productId);
                  if (!p) return null;
                  return (
                    <li key={line.productId + (line.color ?? "") + (line.size ?? "")} className="flex items-center gap-4 py-4">
                      <Image src={p.image} alt="" width={72} height={72} sizes="72px" className="h-[72px] w-[72px] shrink-0 rounded-xl bg-gray-100 object-contain p-1.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{p.name}</span>
                        {(line.size || line.color) && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {[line.size && `Size ${line.size}`, line.color].filter(Boolean).join(" · ")}
                          </span>
                        )}
                        <span className="mt-1 block font-mono2 text-[11px] text-muted-foreground">Quantity: {line.qty}</span>
                      </span>
                      <span className="shrink-0 font-mono2 text-sm">{formatPrice(p.price * line.qty)}</span>
                    </li>
                  );
                })}
              </ul>
              <dl className="space-y-3 border-t border-neutral-200 px-5 py-5 text-sm dark:border-border sm:px-7">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-mono2">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="font-mono2">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-medium dark:border-border">
                  <dt>Total</dt>
                  <dd className="font-mono2">{formatPrice(total)}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* Step 1: contact and address */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <p className="label-mono mb-4">Shipping address</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <CountryRegionPicker
                    country={form.country}
                    region={form.region}
                    onCountryChange={(country) => setForm((current) => ({ ...current, country, region: "" }))}
                    onRegionChange={(region) => setForm((current) => ({ ...current, region }))}
                  />
                  <input value={form.street} onChange={set("street")} placeholder="Street & number" autoComplete="street-address" className="input-plain rounded-2xl md:col-span-2" />
                  <input value={form.city} onChange={set("city")} placeholder="City" autoComplete="address-level2" className="input-plain rounded-2xl md:col-span-2" />
                </div>
              </div>
              <div>
                <p className="label-mono mb-4">Contact</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <input value={form.name} onChange={set("name")} placeholder="Name" autoComplete="name" className="input-plain rounded-2xl md:col-span-2" />
                  <input type="email" value={form.email} onChange={set("email")} placeholder="Email address" autoComplete="email" className="input-plain rounded-2xl" />
                  <input type="tel" value={form.phone} onChange={set("phone")} placeholder="Phone number" autoComplete="tel" className="input-plain rounded-2xl" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: delivery */}
          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <p className="label-mono mb-2">Delivery method</p>
              {deliveryOptions.map((d) => (
                <label
                  key={d.id}
                  className={`flex cursor-pointer items-center justify-between gap-4 border p-5 transition-colors ${
                    form.delivery === d.id ? "border-foreground bg-card" : "border-border hover:border-foreground/50"
                  }`}
                >
                  <span className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="delivery"
                      checked={form.delivery === d.id}
                      onChange={() => setForm((f) => ({ ...f, delivery: d.id }))}
                      className="h-4 w-4 accent-current"
                    />
                    <span>
                      <span className="block text-sm font-medium">{d.name}</span>
                      <span className="block font-mono2 text-[11px] text-muted-foreground">{d.eta}</span>
                    </span>
                  </span>
                  <span className="font-mono2 text-sm">{d.price === 0 ? (qualifiesForFreeShipping ? "Free" : formatPrice(STANDARD_SHIPPING_FEE_NGN)) : formatPrice(d.price)}</span>
                </label>
              ))}
              <textarea
                value={form.notes}
                onChange={set("notes")}
                placeholder="Delivery notes (optional) — gate codes, floor, 'leave with neighbour'…"
                rows={3}
                className="input-plain mt-2"
              />
            </div>
          )}

          {/* Step 3: payment (mock) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border border-border bg-card p-4">
                <Lock className="h-4 w-4 text-primary" />
                <p className="font-mono2 text-[11px] text-muted-foreground">
                  Demo checkout — no real payment is processed. Use any test card number.
                </p>
              </div>
              <div>
                <p className="label-mono mb-4 flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Card details</p>
                <div className="space-y-4">
                  <input
                    value={form.card}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setForm((f) => ({ ...f, card: digits.replace(/(.{4})/g, "$1 ").trim() }));
                    }}
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    className="input-plain font-mono2 md:col-span-2"
                  />
                  <input
                    value={form.expiry}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setForm((f) => ({ ...f, expiry: d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d }));
                    }}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    className="input-plain font-mono2"
                  />
                  <input
                    value={form.cvc}
                    onChange={(e) => setForm((f) => ({ ...f, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="CVC"
                    inputMode="numeric"
                    className="input-plain font-mono2"
                  />
                  <input value={form.nameOnCard} onChange={set("nameOnCard")} placeholder="Name on card" className="input-plain md:col-span-2" />
                </div>
              </div>
            </div>
          )}

          </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          {step === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setPaymentNoticeOpen(true)}
                className="btn-solid-invert h-10 w-full max-w-xs rounded-[10px] px-4 py-2 text-[11px]"
              >
                <ShoppingCart className="h-4 w-4" /> Proceed with payment
              </button>
              <Link href="/categories" className="inline-flex items-center gap-1.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to store
              </Link>
            </div>
          ) : (
            <div className="mt-10 flex items-center justify-between gap-4">
              <button onClick={() => setStep((s) => s - 1)} className="btn-outline-invert h-10 rounded-[10px] px-4 py-2 text-[11px]">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < 3 ? (
                <button
                  onClick={() => (canContinue ? setStep((s) => s + 1) : toast.error("Please complete the required fields"))}
                  className="btn-solid-invert h-10 rounded-[10px] px-4 py-2 text-[11px]"
                >
                  {step === 1 ? "Continue to delivery" : "Continue to payment"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={placeOrder} className="btn-solid-invert h-10 rounded-[10px] px-4 py-2 text-[11px]">
                  <Lock className="h-4 w-4" /> Place order — {formatPrice(total)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <AlertDialog open={paymentNoticeOpen} onOpenChange={setPaymentNoticeOpen}>
        <AlertDialogContent className="rounded-2xl border-0 bg-neutral-100 dark:bg-neutral-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-light">
              Payment is under development
            </AlertDialogTitle>
            <AlertDialogDescription>
              Our technical team is still building the payment experience. Your order has not been submitted,
              and you won&apos;t be asked for your address or country. Return to your cart to continue shopping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => router.push("/cart")}
              className="rounded-[10px]"
            >
              Return to cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
