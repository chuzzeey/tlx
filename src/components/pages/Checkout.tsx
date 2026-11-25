"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Handbag,
  Landmark,
  LoaderCircle,
  PackageCheck,
  ShoppingCart,
  X,
} from "lucide-react";
import { Barcode, Stamp } from "@/components/Ornaments";
import { AnimatePresence, motion } from "framer-motion";
import { useCatalog } from "@/store/CatalogContext";
import { PageSkeleton } from "@/components/ProductCard";
import { isProductInStock } from "@/lib/product-availability";
import { formatPrice as formatNgnPrice } from "@/lib/currency";
import { EASE } from "@/components/motion/motion";
import { useShop } from "@/store/ShopContext";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";
import { useStorefrontContact } from "@/store/useStorefrontContact";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { toast } from "sonner";
import CountryRegionPicker from "@/components/checkout/CountryRegionPicker";
import {
  createStoreOrderResponseSchema,
  customerDetailsSchema,
  optionalCustomerEmailSchema,
  receiptTokenSchema,
  type CreateStoreOrderResponse,
} from "@/lib/store-order-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Form {
  email: string; name: string; phone: string; street: string; city: string; country: string; region: string;
}

const initial: Form = {
  email: "", name: "", phone: "", street: "", city: "", country: "Nigeria", region: "",
};

const savedDetailsStorageKey = "tlx-checkout-details-v1";
const orderAttemptStorageKey = "tlx-checkout-order-attempt-v1";

type OrderAttempt = {
  idempotencyKey: string;
  receiptToken: string;
};

type OrderConfirmation = CreateStoreOrderResponse & {
  whatsappUrl: string;
};

const transferAccount = {
  bank: "Moniepoint",
  name: "TLX Brand Aura Styles Businesses",
  number: "6651628647",
};

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
  const { products } = useCatalog();
  const { cart, cartCount, subtotal, clearCart, hydrated } = useShop();
  const { formatPrice } = useStorefrontCurrency();
  const { whatsappHref } = useStorefrontContact();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initial);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "ready">("idle");
  const [accountCopied, setAccountCopied] = useState(false);
  const [rememberDetails, setRememberDetails] = useState(true);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderSubmissionError, setOrderSubmissionError] = useState<string | null>(null);
  const orderAttemptRef = useRef<OrderAttempt | null>(null);

  useEffect(() => {
    try {
      const savedDetails = window.localStorage.getItem(savedDetailsStorageKey);
      if (!savedDetails) return;

      const parsed = customerDetailsSchema.safeParse(JSON.parse(savedDetails));
      if (!parsed.success) {
        console.error("Saved checkout details are invalid.", parsed.error);
        toast.error("Saved delivery details could not be loaded. Please enter them again.");
        return;
      }

      // Sync saved browser data into the controlled checkout fields.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate from browser storage on mount.
      setForm((current) => ({ ...current, ...parsed.data }));
      setHasSavedDetails(true);
    } catch (error) {
      console.error("Could not read saved checkout details.", error);
      toast.error("Saved delivery details could not be accessed in this browser.");
    }
  }, []);

  useEffect(() => {
    if (!paymentNoticeOpen || paymentStatus !== "processing") return;
    const timer = window.setTimeout(() => setPaymentStatus("ready"), 3000);
    return () => window.clearTimeout(timer);
  }, [paymentNoticeOpen, paymentStatus]);

  useEffect(() => {
    if (!accountCopied) return;
    const timer = window.setTimeout(() => setAccountCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [accountCopied]);

  const openTransferDetails = () => {
    setOrderSubmissionError(null);
    setPaymentStatus("processing");
    setPaymentNoticeOpen(true);
  };

  const handlePaymentDialogChange = (open: boolean) => {
    if (!open && isCreatingOrder) return;
    setPaymentNoticeOpen(open);
    if (!open) setPaymentStatus("idle");
  };

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(transferAccount.number);
      setAccountCopied(true);
    } catch {
      toast.error("Could not copy the account number. Please copy it manually.", {
        description: transferAccount.number,
      });
    }
  };

  const total = subtotal;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canContinue = useMemo(() => {
    if (step === 1) {
      return Boolean(
        optionalCustomerEmailSchema.safeParse(form.email).success &&
        form.name.trim() &&
        form.phone.trim() &&
        form.street.trim() &&
        form.city.trim() &&
        form.country.trim() &&
        form.region.trim()
      );
    }
    return true;
  }, [step, form]);

  const saveCustomerDetails = () => {
    if (!rememberDetails) {
      try {
        window.localStorage.removeItem(savedDetailsStorageKey);
        setHasSavedDetails(false);
      } catch (error) {
        console.error("Could not remove saved checkout details.", error);
        toast.error("Saved delivery details could not be removed from this browser.");
      }
      return;
    }

    const parsed = customerDetailsSchema.safeParse({
      name: form.name,
      email: form.email,
      phone: form.phone,
      street: form.street,
      city: form.city,
      country: form.country,
      region: form.region,
    });
    if (!parsed.success) return;

    try {
      window.localStorage.setItem(savedDetailsStorageKey, JSON.stringify(parsed.data));
      setHasSavedDetails(true);
    } catch (error) {
      console.error("Could not save checkout details.", error);
      toast.error("Delivery details could not be saved in this browser. You can still continue checkout.");
    }
  };

  const removeSavedDetails = () => {
    try {
      window.localStorage.removeItem(savedDetailsStorageKey);
      setHasSavedDetails(false);
      setRememberDetails(false);
      toast.success("Saved delivery details removed from this browser.");
    } catch (error) {
      console.error("Could not remove saved checkout details.", error);
      toast.error("Saved delivery details could not be removed from this browser.");
    }
  };

  const getOrderAttempt = (): OrderAttempt => {
    if (orderAttemptRef.current) return orderAttemptRef.current;

    try {
      const savedAttempt = window.sessionStorage.getItem(orderAttemptStorageKey);
      if (savedAttempt) {
        const parsed: unknown = JSON.parse(savedAttempt);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "idempotencyKey" in parsed &&
          typeof parsed.idempotencyKey === "string" &&
          "receiptToken" in parsed &&
          typeof parsed.receiptToken === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            parsed.idempotencyKey,
          ) &&
          receiptTokenSchema.safeParse(parsed.receiptToken).success
        ) {
          orderAttemptRef.current = {
            idempotencyKey: parsed.idempotencyKey,
            receiptToken: parsed.receiptToken,
          };
          return orderAttemptRef.current;
        }
      }

      const randomBytes = window.crypto.getRandomValues(new Uint8Array(16));
      const attempt = {
        idempotencyKey: window.crypto.randomUUID(),
        receiptToken: window
          .btoa(String.fromCharCode(...randomBytes))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, ""),
      };
      window.sessionStorage.setItem(orderAttemptStorageKey, JSON.stringify(attempt));
      orderAttemptRef.current = attempt;
      return attempt;
    } catch (error) {
      console.error("Could not prepare an idempotent order submission.", error);
      throw new Error("Checkout could not prepare a secure order submission. Please try again.");
    }
  };

  const completeBankTransferOrder = async () => {
    if (isCreatingOrder) return;
    setIsCreatingOrder(true);
    setOrderSubmissionError(null);

    try {
      const attempt = getOrderAttempt();
      const requestBody = {
        ...attempt,
        expectedTotalAmount: total,
        customer: {
          name: form.name,
          email: form.email.trim() || undefined,
          phone: form.phone,
          street: form.street,
          city: form.city,
          region: form.region,
          country: form.country,
        },
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.qty,
          ...(line.size ? { size: line.size } : {}),
        })),
      };
      const response = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const responseBody: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof responseBody === "object" &&
          responseBody !== null &&
          "error" in responseBody &&
          typeof responseBody.error === "string"
            ? responseBody.error
            : "Your order could not be saved. Please try again.";
        throw new Error(errorMessage);
      }

      const parsedResponse = createStoreOrderResponseSchema.safeParse(responseBody);
      if (!parsedResponse.success) {
        throw new Error("The order was saved, but the confirmation could not be read. Please contact TLX Originals.");
      }

      const message = [
        "Hi TLX Originals,",
        "",
        `I placed order ${parsedResponse.data.orderId}.`,
        `Order details: ${parsedResponse.data.receiptUrl}`,
        "",
        "I'll send my bank transfer receipt here for verification.",
      ].join("\n");
      const confirmation: OrderConfirmation = {
        ...parsedResponse.data,
        whatsappUrl: `${whatsappHref}?text=${encodeURIComponent(message)}`,
      };
      setOrderConfirmation(confirmation);
      clearCart();
      try {
        window.sessionStorage.removeItem(orderAttemptStorageKey);
      } catch (error) {
        console.error("Could not clear the completed checkout attempt.", error);
      }
      handlePaymentDialogChange(false);
      toast.success("Order saved", { description: `Order ${confirmation.orderId} is awaiting payment verification.` });
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Your order could not be saved. Please try again.";
      console.error("Could not complete the bank-transfer order.", error);
      setOrderSubmissionError(message);
      toast.error("Order could not be saved", { description: message });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const continueCheckout = () => {
    if (!canContinue) {
      toast.error("Please check the required details and email address.");
      return;
    }
    if (step === 1) saveCustomerDetails();
    setStep((current) => current + 1);
  };

  if (orderConfirmation) {
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
        <p className="label-mono mt-8">Order received</p>
        <h1 className="mt-4 font-display text-4xl font-light sm:text-5xl">Thank you, {form.name}.</h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Order <span className="font-mono2 text-foreground">{orderConfirmation.orderId}</span> is saved and awaiting
          manual bank-transfer verification. Payment is not considered confirmed until TLX Originals verifies the transfer.
        </p>
        {orderConfirmation.emailStatus === "sent" ? (
          <p className="mt-3 text-sm text-muted-foreground">The store has been notified by email.</p>
        ) : (
          <p className="mt-3 max-w-md text-sm text-amber-700" role="status">
            {orderConfirmation.message ?? "The store email is not confirmed. You can still share your order on WhatsApp."}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center gap-2 text-foreground/70">
          <Barcode code={orderConfirmation.orderId} className="h-8 w-44" />
          <span className="font-mono2 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
            {orderConfirmation.orderId} · TLX Originals
          </span>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href={orderConfirmation.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-solid-invert"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Send order details on WhatsApp
          </a>
          <Link href={orderConfirmation.receiptUrl} className="btn-outline-invert">View order receipt</Link>
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

  const requestedQuantityByProduct = new Map<string, number>();
  for (const line of cart) {
    requestedQuantityByProduct.set(
      line.productId,
      (requestedQuantityByProduct.get(line.productId) ?? 0) + line.qty,
    );
  }
  const unavailableItems = cart.filter((line) => {
    const product = products.find((candidate) => candidate.id === line.productId);
    return (
      !product ||
      !isProductInStock(product) ||
      product.stock < (requestedQuantityByProduct.get(line.productId) ?? line.qty)
    );
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
            <section
              className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-border"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <div className="border-b border-neutral-200 px-5 py-5 dark:border-border sm:px-7">
                <p className="label-mono text-center">Order summary</p>
              </div>
              <ul className="divide-y divide-neutral-200 px-5 dark:divide-border sm:px-7">
                {cart.map((line) => {
                  const p = products.find((product) => product.id === line.productId);
                  if (!p) return null;
                  return (
                    <li key={line.productId + (line.size ?? "")} className="flex items-center gap-4 py-4">
                      <Image src={p.image} alt="" width={72} height={72} quality={100} sizes="72px" className="h-[72px] w-[72px] shrink-0 rounded-xl object-contain p-1.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{p.name}</span>
                        {line.size && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Size {line.size}
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
                <div className="flex justify-between text-muted-foreground">
                  <dt>Deliveries</dt>
                  <dd>1-3 days</dd>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-medium dark:border-border">
                  <dt>Total</dt>
                  <dd className="font-mono2">{formatPrice(total)}</dd>
                </div>
              </dl>
              <Accordion
                type="single"
                collapsible
                className="border-t border-neutral-200 px-5 dark:border-border sm:px-7"
              >
                <AccordionItem value="delivery">
                  <AccordionTrigger className="py-4 hover:no-underline">
                    Read more about delivery
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Estimated delivery is 1-3 days. Timing may vary by location.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
                  <div>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="Email address (optional)" autoComplete="email" className="input-plain w-full rounded-2xl" />
                    <p className="mt-2 text-xs text-muted-foreground">Email is optional. We send the order notification to the store.</p>
                  </div>
                  <input type="tel" value={form.phone} onChange={set("phone")} placeholder="Phone number" autoComplete="tel" className="input-plain rounded-2xl" />
                </div>
                <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={rememberDetails}
                      onChange={(event) => {
                        setRememberDetails(event.target.checked);
                        if (!event.target.checked) {
                          try {
                            window.localStorage.removeItem(savedDetailsStorageKey);
                            setHasSavedDetails(false);
                          } catch (error) {
                            console.error("Could not remove saved checkout details.", error);
                            toast.error("Saved delivery details could not be removed from this browser.");
                          }
                        }
                      }}
                      className="size-4 accent-foreground"
                    />
                    Remember my details on this browser
                  </label>
                  {hasSavedDetails && (
                    <button
                      type="button"
                      onClick={removeSavedDetails}
                      className="w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      Remove saved details
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground sm:basis-full">
                    Details stay on this device until you remove them.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: delivery */}
          {step === 2 && (
            <div className="py-8 text-center">
              <p className="text-base font-medium">Deliveries 1-3 days</p>
            </div>
          )}

          {/* Step 3: bank transfer */}
          {step === 3 && (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <p className="label-mono flex items-center gap-2"><Landmark className="h-4 w-4" /> Bank transfer</p>
              <h2 className="mt-4 font-display text-3xl font-light">Pay securely by transfer</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Review your delivery details, then view the Moniepoint account information. Your order total is{" "}
                <span className="font-medium text-foreground">{formatNgnPrice(total)}</span>.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Deliveries 1-3 days. Payment is verified manually.</p>
            </div>
          )}

          </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          {step === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-solid-invert h-10 w-full max-w-xs rounded-[10px] px-4 py-2 text-[11px]"
              >
                <ShoppingCart className="h-4 w-4" /> Continue to delivery details
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
                  onClick={continueCheckout}
                  className="btn-solid-invert h-10 rounded-[10px] px-4 py-2 text-[11px]"
                >
                  {step === 1 ? "Continue to delivery" : "Continue to payment"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={openTransferDetails} className="btn-solid-invert h-10 rounded-[10px] px-4 py-2 text-[11px]">
                  <Landmark className="h-4 w-4" /> View bank transfer details
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <Dialog open={paymentNoticeOpen} onOpenChange={handlePaymentDialogChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_24px_70px_rgba(47,36,23,0.2)] sm:p-8"
        >
          <DialogClose
            aria-label="Close payment details"
            disabled={isCreatingOrder}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogClose>
          {paymentStatus === "processing" ? (
            <div className="flex flex-col items-center py-5 text-center" role="status" aria-live="polite">
              <div className="relative grid size-24 place-items-center rounded-full bg-gray-100">
                <span className="absolute inset-1 rounded-full border border-gray-300" aria-hidden="true" />
                <LoaderCircle
                  className="h-16 w-16 animate-spin text-neutral-700"
                  strokeWidth={1.35}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-6 font-mono2 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                TLX secure checkout
              </p>
              <DialogTitle className="mt-2 font-display text-2xl font-light">
                Preparing your transfer
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-xs leading-relaxed">
                We&apos;re getting your Moniepoint payment details ready. This will only take a moment.
              </DialogDescription>
              <div className="mt-7 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className="h-full rounded-full bg-neutral-700"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="pr-8">
                <span className="mb-1 inline-flex size-10 items-center justify-center rounded-full bg-gray-100 text-neutral-700">
                  <Landmark className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="font-mono2 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                  TLX secure checkout
                </p>
                <DialogTitle className="font-display text-2xl font-light">Pay by bank transfer</DialogTitle>
                <DialogDescription className="leading-relaxed">
                  Transfer <span className="font-semibold text-foreground">{formatNgnPrice(total)}</span> to complete your order.
                </DialogDescription>
              </DialogHeader>
              <dl className="space-y-4 rounded-2xl border border-gray-200 bg-gray-100 p-4 text-sm sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Bank</dt>
                  <dd className="font-medium">{transferAccount.bank}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Account name</dt>
                  <dd className="max-w-[65%] text-right font-medium">{transferAccount.name}</dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                  <dt className="text-muted-foreground">Account number</dt>
                  <dd className="flex items-center gap-2 font-mono2 font-semibold">
                    {transferAccount.number}
                    <button
                      type="button"
                      onClick={copyAccountNumber}
                      aria-label={accountCopied ? "Account number copied" : "Copy account number"}
                      aria-live="polite"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2 text-xs transition-colors hover:bg-muted"
                    >
                      {accountCopied ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {accountCopied ? "Copied" : "Copy"}
                    </button>
                  </dd>
                </div>
              </dl>
              <p className="text-xs leading-relaxed text-muted-foreground">
                After you transfer, keep your receipt and contact TLX to confirm payment. Payment is not automatically verified here.
              </p>
              {orderSubmissionError && (
                <p className="text-sm text-destructive" role="alert">
                  {orderSubmissionError}
                </p>
              )}
              <DialogFooter>
                <button
                  type="button"
                  onClick={completeBankTransferOrder}
                  disabled={isCreatingOrder}
                  className="btn-solid-invert w-full rounded-[10px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingOrder && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isCreatingOrder ? "Saving your order..." : "Done"}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
