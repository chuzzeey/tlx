"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CreditCard, Package, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { type Product } from "@/data/catalog";
import { orders, orderTotal, type Order, type OrderItem } from "@/data/account";
import { readCustomerReviews, saveCustomerReview, type CustomerReview } from "@/data/customerReviews";
import { useShop } from "@/store/ShopContext";
import { useCatalog } from "@/store/CatalogContext";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type OrderGroup = "Waiting Payment" | "Packing" | "On Delivery" | "Completed";
type ReviewTarget = { order: Order; item: OrderItem; product: Product };

const orderGroups: { label: OrderGroup; icon: typeof CreditCard }[] = [
  { label: "Waiting Payment", icon: CreditCard },
  { label: "Packing", icon: Package },
  { label: "On Delivery", icon: Truck },
  { label: "Completed", icon: Check },
];

function orderGroup(order: Order): OrderGroup {
  if (order.status === "Processing") return "Waiting Payment";
  if (order.status === "In transit") return "On Delivery";
  return "Completed";
}

function OrderHeader() {
  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <Link href="/" aria-label="Back to home" className="flex h-11 w-11 items-center justify-center">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold">Order History</h1>
      <span className="h-11 w-11" />
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { products } = useCatalog();
  const { formatPrice } = useStorefrontCurrency();
  const { addToCart } = useShop();
  const [activeGroup, setActiveGroup] = useState<OrderGroup>("Waiting Payment");
  const [savedReviews, setSavedReviews] = useState<CustomerReview[]>([]);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [readingReview, setReadingReview] = useState(false);

  useEffect(() => {
    const requestedGroup = orderGroups.find(
      ({ label }) => label === new URLSearchParams(window.location.search).get("group")
    )?.label;
    if (requestedGroup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveGroup(requestedGroup);
    }
  }, []);

  useEffect(() => {
    try {
      // Read browser-only reviews after hydration to keep server and first render consistent.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedReviews(readCustomerReviews());
    } catch (error) {
      toast.error("Saved reviews couldn't be loaded.", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, []);

  const visibleOrders = orders.filter((order) => orderGroup(order) === activeGroup);
  const savedReviewFor = (orderId: string, productId: string) =>
    savedReviews.find((review) => review.orderId === orderId && review.productId === productId);

  const openReview = (order: Order, item: OrderItem, product: Product) => {
    const saved = savedReviewFor(order.id, product.id);
    setReviewTarget({ order, item, product });
    setRating(saved?.rating ?? 0);
    setReviewText(saved?.body ?? "");
    setReadingReview(Boolean(saved));
  };

  const completePayment = (order: Order) => {
    order.items.forEach((item) => addToCart(item.productId, item.qty, item.size));
    toast.info("Order added to checkout", { description: "Confirm your details to complete payment." });
    router.push("/checkout");
  };

  const submitReview = () => {
    if (!reviewTarget || rating < 1) return;
    const review: CustomerReview = {
      id: `${reviewTarget.order.id}-${reviewTarget.product.id}`,
      orderId: reviewTarget.order.id,
      productId: reviewTarget.product.id,
      author: "You",
      location: "Verified buyer",
      rating,
      date: new Date().toISOString().slice(0, 10),
      title: "Verified purchase",
      body: reviewText.trim() || `Rated ${rating} out of 5 stars.`,
      verified: true,
    };

    try {
      setSavedReviews(saveCustomerReview(review));
      setReadingReview(true);
      toast.success("Review saved");
    } catch (error) {
      toast.error("Your review couldn't be saved.", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const currentReview = reviewTarget
    ? savedReviewFor(reviewTarget.order.id, reviewTarget.product.id)
    : undefined;

  return (
    <div>
      <OrderHeader />

      <div className="container-x hidden max-w-6xl py-10 md:block">
        <p className="label-mono">Your account</p>
        <h1 className="mt-2 text-3xl font-semibold">Order History</h1>
      </div>

      <main className="container-x mx-auto min-h-[100dvh] max-w-5xl py-5 md:py-0">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:px-0">
          {orderGroups.map(({ label, icon: Icon }) => {
            const active = activeGroup === label;
            const count = orders.filter((order) => orderGroup(order) === label).length;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveGroup(label)}
                aria-pressed={active}
                className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm transition-colors ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "border-transparent bg-neutral-100 text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className={active ? "text-white/70" : "text-muted-foreground"}>({count})</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-4">
          {visibleOrders.length ? visibleOrders.map((order) => (
            <article key={order.id} className="rounded-2xl bg-neutral-50 p-4 dark:bg-muted/40">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Order {order.id}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(order.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] text-muted-foreground dark:bg-background">
                  {activeGroup}
                </span>
              </div>

              <div className="space-y-3">
                {order.items.map((item, index) => {
                  const product = products.find((candidate) => candidate.id === item.productId);
                  if (!product) return null;
                  const savedReview = savedReviewFor(order.id, product.id);
                  const isCompleted = order.status === "Delivered";
                  return (
                    <div key={`${item.productId}-${index}`} className="flex items-center gap-3 rounded-2xl bg-white p-2 dark:bg-background">
                      <Link
                        href={`/products/${product.id}`}
                        className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[18px] bg-gray-100"
                      >
                        <Image src={product.image} alt={product.name} fill sizes="88px" className="object-contain p-2" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${product.id}`} className="line-clamp-2 text-sm font-semibold leading-tight">
                          {product.name}
                        </Link>
                        {item.size && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Size: {item.size}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{formatPrice(item.price)}</p>
                          <span className="text-xs text-muted-foreground">×{item.qty}</span>
                        </div>
                        {isCompleted && (
                          <button
                            type="button"
                            onClick={() => openReview(order, item, product)}
                            className="mt-2 text-xs font-medium text-muted-foreground underline underline-offset-4"
                          >
                            {savedReview ? "Read review" : "Leave a review"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-200 px-1 pt-3 dark:border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Estimate Total</p>
                  <p className="mt-1 text-base font-semibold">{formatPrice(orderTotal(order))}</p>
                </div>
                {order.status === "Processing" ? (
                  <button
                    type="button"
                    onClick={() => completePayment(order)}
                    className="rounded-full bg-neutral-900 px-7 py-3 text-sm font-medium text-white"
                  >
                    Pay Now
                  </button>
                ) : order.status === "In transit" ? (
                  <button
                    type="button"
                    onClick={() => toast.info("Tracking", { description: "Your parcel is on its way." })}
                    className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-medium"
                  >
                    Track order
                  </button>
                ) : null}
              </div>
            </article>
          )) : (
            <div className="rounded-2xl bg-neutral-50 px-5 py-12 text-center dark:bg-muted/40">
              <p className="font-medium">No {activeGroup.toLowerCase()} orders</p>
              <p className="mt-2 text-sm text-muted-foreground">Your orders will appear here when their status changes.</p>
            </div>
          )}
        </div>
      </main>

      <Sheet
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] gap-0 overflow-y-auto rounded-t-[28px] border-0 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 sm:mx-auto sm:max-w-lg"
        >
          <div className="mx-auto h-1.5 w-14 rounded-full bg-neutral-200" />
          <SheetHeader className="px-0 pb-4 pt-5 text-center">
            <SheetTitle className="text-xl">{readingReview ? "Your Review" : "Leave a Review"}</SheetTitle>
            <SheetDescription>
              {readingReview ? "Your verified purchase review." : "Take a moment to rate and review this piece."}
            </SheetDescription>
          </SheetHeader>

          {reviewTarget && (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-neutral-100 p-2.5 dark:bg-muted">
                <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                  <Image
                    src={reviewTarget.product.image}
                    alt={reviewTarget.product.name}
                    fill
                    sizes="88px"
                    className="object-contain p-2"
                  />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold">{reviewTarget.product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {reviewTarget.item.size ? `Size: ${reviewTarget.item.size} · ` : ""}
                    Qty: {reviewTarget.item.qty}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] dark:bg-background">
                    Completed
                  </span>
                  <p className="mt-1 text-sm font-semibold">
                    {formatPrice(reviewTarget.item.price * reviewTarget.item.qty)}
                  </p>
                </div>
              </div>

              {readingReview && currentReview ? (
                <div className="py-6 text-center">
                  <div className="flex justify-center gap-1" aria-label={`${currentReview.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={`h-7 w-7 ${index < currentReview.rating ? "fill-amber-500 text-amber-500" : "text-neutral-300"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-left text-sm leading-relaxed text-muted-foreground">{currentReview.body}</p>
                  <p className="mt-3 text-left text-xs text-muted-foreground">
                    {new Date(currentReview.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewTarget(null)}
                      className="flex-1 rounded-full border border-border py-3 text-sm font-medium"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => setReadingReview(false)}
                      className="flex-1 rounded-full bg-neutral-900 py-3 text-sm font-medium text-white"
                    >
                      Edit Review
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="py-6 text-center">
                    <p className="text-base font-semibold">How is your order?</p>
                    <p className="mt-2 text-sm text-muted-foreground">Please take a moment to rate and review...</p>
                    <div className="mt-5 flex justify-center gap-2" role="group" aria-label="Rating">
                      {Array.from({ length: 5 }, (_, index) => {
                        const value = index + 1;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            aria-label={`Rate ${value} ${value === 1 ? "star" : "stars"}`}
                            aria-pressed={rating === value}
                            className="p-0.5"
                          >
                            <Star className={`h-8 w-8 ${value <= rating ? "fill-amber-500 text-amber-500" : "text-neutral-300"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="sr-only" htmlFor="order-review">Write your review</label>
                  <textarea
                    id="order-review"
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    placeholder="Type review..."
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring dark:bg-muted"
                  />
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewTarget(null)}
                      className="flex-1 rounded-full border border-border py-3.5 text-sm font-medium"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={rating < 1}
                      className="flex-1 rounded-full bg-neutral-900 py-3.5 text-sm font-medium text-white disabled:opacity-40"
                    >
                      Rate
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
