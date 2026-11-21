"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Handbag, Minus, Plus, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  categoryBySlug,
  formatPrice,
  FREE_SHIPPING_THRESHOLD_NGN,
  reviewsFor,
  type Product,
} from "@/data/catalog";
import { readCustomerReviews, type CustomerReview } from "@/data/customerReviews";
import ProductCard, { Stars } from "@/components/ProductCard";
import { EASE, Reveal, Stagger, StaggerItem } from "@/components/motion/motion";
import { Footnote } from "@/components/Ornaments";
import { isProductInStock } from "@/lib/product-availability";
import { defaultProductSize, productSizeOptions } from "@/lib/product-variants";
import { useShop } from "@/store/ShopContext";
import { useCatalog } from "@/store/CatalogContext";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const MotionImage = motion.create(Image);

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < Math.round(rating)
              ? "fill-[#FFC107] text-[#D99700]"
              : "fill-neutral-200 text-neutral-300"
          }`}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function ReviewVerification({
  review,
  className = "",
}: {
  review: { sample?: boolean; verified?: boolean };
  className?: string;
}) {
  const isDevelopmentSample = process.env.NODE_ENV === "development" && review.sample;

  if (review.sample && !isDevelopmentSample) {
    return <span className={`text-muted-foreground ${className}`}>Sample review</span>;
  }

  if (!review.verified && !isDevelopmentSample) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-green-700 dark:text-green-400 ${className}`}>
      <Check className="h-3 w-3" /> Verified purchase
    </span>
  );
}

export default function ProductDetail({ productId, initialProduct }: { productId: string; initialProduct: Product }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, status, error, source } = useCatalog();
  const product = status === "loading"
    ? initialProduct
    : products.find((candidate) => candidate.id === productId);
  const { addToCart, cartCount, recordView, recent } = useShop();
  const [qty, setQty] = useState(1);
  const [colorSelection, setColorSelection] = useState<{ productId: string; color?: string }>(() => ({
    productId,
  }));
  const color = colorSelection.productId === productId ? colorSelection.color : undefined;
  const setColor = (value: string | undefined) => setColorSelection({ productId, color: value });
  const [imgIdx, setImgIdx] = useState(0);
  const [sizeSelection, setSizeSelection] = useState<{ productId: string; size?: string }>(() => ({
    productId,
    size: defaultProductSize(initialProduct),
  }));
  const selectedSize = sizeSelection.productId === productId
    ? sizeSelection.size
    : defaultProductSize(initialProduct);
  const setSelectedSize = (size: string) => setSizeSelection({ productId, size });
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const scrollToRelatedAfterCollapse = useRef(false);
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);

  /* Keep a rolling trail of viewed pieces (this browser only) */
  useEffect(() => {
    if (product) recordView(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    if (status !== "ready") return;
    let active = true;

    try {
      if (source !== "supabase") {
        setCustomerReviews(readCustomerReviews());
        return () => {
          active = false;
        };
      }

      void fetch(`/api/store/products/${encodeURIComponent(productId)}/reviews`, { cache: "no-store" })
        .then(async (response) => {
          const result = (await response.json()) as {
            reviews?: Array<{
              id: string;
              author: string;
              location: string;
              rating: number;
              title: string;
              body: string;
              is_verified: boolean;
              created_at: string;
            }>;
            error?: string;
          };
          if (!response.ok || !Array.isArray(result.reviews)) {
            throw new Error(result.error ?? "Approved reviews could not be loaded.");
          }
          if (!active) return;
          setCustomerReviews(result.reviews.map((review) => ({
            id: review.id,
            productId,
            orderId: "",
            author: review.author,
            location: review.location,
            rating: review.rating,
            title: review.title,
            body: review.body,
            verified: review.is_verified,
            sample: false,
            date: review.created_at,
          })));
        })
        .catch((cause: unknown) => {
          if (!active) return;
          toast.error("Approved reviews couldn't be loaded.", {
            description: cause instanceof Error ? cause.message : undefined,
          });
        });
    } catch (error) {
      toast.error("Saved reviews couldn't be loaded.", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
    return () => {
      active = false;
    };
  }, [productId, source, status]);

  useEffect(() => {
    if (showAllReviews || !scrollToRelatedAfterCollapse.current) return;

    scrollToRelatedAfterCollapse.current = false;
    const reviewListId = window.matchMedia("(min-width: 768px)").matches
      ? "desktop-review-list"
      : "mobile-review-list";
    document
      .getElementById(reviewListId)
      ?.querySelector("article:last-child")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showAllReviews]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const siblings = products.filter((p) => p.category === product.category && p.id !== product.id);
    return [...new Set([product.image, ...(product.gallery ?? []), ...siblings.map((s) => s.image)])].slice(0, 3);
  }, [product, products]);

  if (!product) {
    return (
      <div className="container-x py-24 text-center">
        <p role={status === "error" ? "alert" : undefined} className="font-display text-3xl font-light">
          {status === "error" ? `The catalog is unavailable: ${error}` : "This piece is no longer available."}
        </p>
        <Link href="/products" className="btn-outline-invert mt-8">Back to the collection</Link>
      </div>
    );
  }

  const cat = categoryBySlug(product.category);
  const productCustomerReviews = customerReviews.filter((review) => review.productId === product.id);
  const reviews = source === "built-in"
    ? [...productCustomerReviews, ...reviewsFor(product.id)]
    : productCustomerReviews;
  const reviewsToShow = reviews.slice(0, showAllReviews ? 8 : 3);
  const hasMoreReviews = reviews.length > 3;
  const reviewCount = source === "built-in"
    ? product.reviewCount + productCustomerReviews.length
    : product.reviewCount;
  const averageRating = source === "supabase"
    ? product.rating
    : reviewCount
      ? (product.rating * product.reviewCount +
          productCustomerReviews.reduce((sum, review) => sum + review.rating, 0)) /
        reviewCount
      : 0;
  const related = products.filter((p) => p.category === product.category && p.id !== product.id);
  const reviewRatingCounts = [5, 4, 3, 2, 1].map((rating) =>
    reviews.filter((review) => review.rating === rating).length
  );
  const recentOthers = recent
    .filter((id) => id !== product.id)
    .map((id) => products.find((candidate) => candidate.id === id))
    .filter(
      (p): p is Product =>
        p !== undefined && !related.some((relatedProduct) => relatedProduct.id === p.id)
    )
    .slice(0, 4);
  const suggestionPool = products.filter(
    (item) => item.id !== product.id && !related.some((relatedProduct) => relatedProduct.id === item.id)
  );
  const youMayAlsoLike = [
    ...recentOthers,
    ...suggestionPool.filter((item) => !recentOthers.some((recentItem) => recentItem.id === item.id)),
  ].slice(0, 4);
  const inStock = isProductInStock(product);
  const low = inStock && product.stock <= 8;
  const colors = product.colors ?? [];
  const defaultColor = colors[0];
  const sizeOptions = productSizeOptions(product);
  const hasSizes = sizeOptions.length > 0;
  const collapseReviews = () => {
    scrollToRelatedAfterCollapse.current = true;
    setShowAllReviews(false);
  };
  const goBack = () => {
    if (searchParams.get("from") === "home") {
      router.replace("/");
      return;
    }
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/products");
  };
  const descriptionPreview = product.description.match(/.*?[.!?](?:\s|$)/)?.[0].trim() ?? product.description;
  const hasMoreDescription = descriptionPreview.length < product.description.length;

  return (
    <div>
      <div className="mobile-product-page">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back to previous page"
            className="flex h-11 w-11 items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-base font-semibold">
            {product.name}
          </p>
          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} items`}
            data-cart-target
            data-cart-target-priority="2"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-muted"
          >
            <Handbag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        <div className="container-x mx-auto max-w-[1400px] pb-10 pt-5 md:pt-8">
          <div className="mb-5 hidden md:block">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground dark:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <div className="grid gap-8 md:grid-cols-2 md:items-start lg:gap-12">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900 md:aspect-square">
            <AnimatePresence mode="popLayout" initial={false}>
              <MotionImage
                key={gallery[imgIdx]}
                src={gallery[imgIdx]}
                alt={product.name}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1400px) 50vw, 700px"
                loading="eager"
                fetchPriority="high"
                className="object-contain p-3"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              />
            </AnimatePresence>
            {gallery.length > 1 && (
              <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setImgIdx(index)}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={imgIdx === index}
                    className={`relative h-12 w-12 overflow-hidden rounded-2xl border-2 bg-background ${
                      imgIdx === index ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="48px"
                      className="rounded-xl object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 md:pt-0">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold leading-tight md:text-4xl">{product.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{cat?.name}</p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <RatingStars rating={averageRating} />
              <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewCount.toLocaleString()} Reviews)</span>
            </div>

            <p className="mt-4 text-2xl font-semibold">{formatPrice(product.price)}</p>
            {product.compareAt && (
              <p className="mt-1 text-sm text-muted-foreground line-through">{formatPrice(product.compareAt)}</p>
            )}

            {hasSizes && (
              <div className="mt-5">
                <p className="mb-2 text-base font-medium">Size</p>
                <div className="flex flex-wrap gap-2.5">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                      className={`h-9 min-w-9 rounded-full border px-3 text-sm transition-colors ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 1 && (
              <div className="mt-5">
                <p className="mb-3 text-sm font-medium">Color — {color ?? product.colors[0].name}</p>
                <div className="flex gap-2.5">
                  {product.colors.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setColor(option.name)}
                      aria-label={option.name}
                      aria-pressed={(color ?? product.colors![0].name) === option.name}
                      className={`h-8 w-8 rounded-full border-2 ${
                        (color ?? product.colors![0].name) === option.name ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: option.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            <section className="mt-5">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {descriptionExpanded ? product.description : descriptionPreview}
                {hasMoreDescription && (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                  className="ml-1 inline text-sm font-medium text-sky-700"
                >
                  {descriptionExpanded ? "Read less" : "Read more..."}
                </button>
                )}
              </p>
            </section>

            <div className="mt-6 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl bg-neutral-100 dark:bg-muted">
              {[
                { icon: Truck, label: `Free over ${formatPrice(FREE_SHIPPING_THRESHOLD_NGN)}` },
                { icon: RotateCcw, label: "30-day returns" },
                { icon: ShieldCheck, label: "5-year guarantee" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 px-2 py-4 text-center">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-[10px] leading-tight text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <Footnote className="mt-3">
              Repaired free for five years — after that, spare parts forever.
            </Footnote>

            <Accordion type="single" collapsible className="mt-6 border-t border-border">
              <AccordionItem value="story" className="border-border">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">The story</AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">{product.story}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="materials" className="border-border">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">Materials & dimensions</AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                  <p><span className="text-foreground">Materials — </span>{product.materials}</p>
                  <p><span className="text-foreground">Dimensions — </span>{product.dimensions}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="care" className="border-border">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">Care</AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">{product.care}</AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-7 flex items-stretch gap-3">
              <div className="flex items-center rounded-full border border-border">
                <button
                  type="button"
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  className="flex h-12 w-10 items-center justify-center"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((current) => Math.min(product.stock, current + 1))}
                  className="flex h-12 w-10 items-center justify-center"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                disabled={!inStock}
                onClick={() => addToCart(product.id, qty, color ?? product.colors?.[0]?.name, hasSizes ? selectedSize : undefined)}
                className="flex-1 rounded-full bg-foreground px-4 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                {!inStock ? "Out of stock" : `Add to cart — ${formatPrice(product.price * qty)}`}
              </button>
            </div>

            <section id="mobile-reviews" className="mt-8 border-t border-border pt-5 md:hidden">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Reviews</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold">{averageRating.toFixed(1)}</span>
                    <RatingStars rating={averageRating} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {reviewCount.toLocaleString()} reviews
                  </p>
                </div>
                {hasMoreReviews && !showAllReviews && (
                  <button
                    type="button"
                    onClick={() => setShowAllReviews(true)}
                    aria-expanded={false}
                    aria-controls="mobile-review-list"
                    className="text-sm text-muted-foreground"
                  >
                    See More
                  </button>
                )}
              </div>
              <div id="mobile-review-list" className="space-y-3">
                {reviewsToShow.map((review) => (
                  <article key={review.id} className="scroll-mt-24 rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <RatingStars rating={review.rating} />
                        <h3 className="mt-2 text-sm font-semibold">{review.title}</h3>
                      </div>
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {new Date(review.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.body}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{review.location ? `${review.author} · ${review.location}` : review.author}</span>
                      <ReviewVerification review={review} />
                    </div>
                  </article>
                ))}
              </div>
              {hasMoreReviews && showAllReviews && (
                <div className="mt-4 border-t border-border pt-4 text-center">
                  <button
                    type="button"
                    onClick={collapseReviews}
                    aria-expanded={true}
                    aria-controls="mobile-review-list"
                    className="text-sm text-muted-foreground underline underline-offset-4"
                  >
                    See Less
                  </button>
                </div>
              )}
            </section>
          </div>
          </div>
        </div>
      </div>

      <section className="container-x mx-auto max-w-6xl space-y-8 pb-12 md:hidden">
        {related.length > 0 && (
          <div className="border-t border-border pt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">More in {cat?.name}</h2>
              <Link
                href={`/categories/${product.category}`}
                className="text-sm text-muted-foreground"
              >
                View category
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {related.slice(0, 4).map((item, index) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  index={index}
                  showIndex={false}
                />
              ))}
            </div>
          </div>
        )}

        {youMayAlsoLike.length > 0 && (
          <div className="border-t border-border pt-8">
            <h2 className="mb-4 text-xl font-semibold">You may also like</h2>
            <div className="grid grid-cols-2 gap-3">
              {youMayAlsoLike.map((item, index) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  index={index}
                  showIndex={false}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="container-x mx-auto hidden max-w-6xl space-y-12 pb-14 md:block">
        <div className="border-t border-border pt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label-mono">Reviews</p>
              <h2 className="mt-2 text-2xl font-semibold">Customer feedback</h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">{reviewCount.toLocaleString()} reviews</p>
              {hasMoreReviews && !showAllReviews && (
                <button
                  type="button"
                  onClick={() => setShowAllReviews(true)}
                  aria-expanded={false}
                  aria-controls="desktop-review-list"
                  className="text-sm text-muted-foreground underline underline-offset-4"
                >
                  See More
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="h-fit rounded-2xl border border-border bg-card p-6">
              <p className="label-mono">Overall rating</p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="font-display text-5xl font-light">{averageRating.toFixed(1)}</p>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <div className="mt-2">
                <RatingStars rating={averageRating} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                From {reviewCount.toLocaleString()} reviews
              </p>
            </aside>
            <div>
              <div id="desktop-review-list" className="space-y-4">
                {reviewsToShow.map((review) => (
                  <article key={review.id} className="scroll-mt-24 rounded-2xl border border-border p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <RatingStars rating={review.rating} />
                        <h3 className="mt-2 text-base font-semibold">{review.title}</h3>
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {new Date(review.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {review.body}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{review.location ? `${review.author} · ${review.location}` : review.author}</span>
                      <ReviewVerification review={review} />
                    </div>
                  </article>
                ))}
              </div>
              {hasMoreReviews && showAllReviews && (
                <div className="mt-4 border-t border-border pt-4 text-center">
                  <button
                    type="button"
                    onClick={collapseReviews}
                    aria-expanded={true}
                    aria-controls="desktop-review-list"
                    className="text-sm text-muted-foreground underline underline-offset-4"
                  >
                    See Less
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">More in {cat?.name}</h2>
              <Link
                href={`/categories/${product.category}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                View category
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {related.slice(0, 4).map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} showIndex={false} />
              ))}
            </div>
          </div>
        )}

        {youMayAlsoLike.length > 0 && (
          <div>
            <h2 className="mb-5 text-xl font-semibold">You may also like</h2>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {youMayAlsoLike.map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} showIndex={false} />
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="hidden">
      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="container-x flex items-center gap-2 py-4 font-mono2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          <Link href="/products" className="flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Shop
          </Link>
          <span>/</span>
          <Link href={`/categories/${product.category}`} className="hover:text-foreground">{cat?.name}</Link>
          <span>/</span>
        </div>
      </div>

      <div className="container-x grid gap-12 py-12 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <div className="relative aspect-square overflow-hidden border border-border bg-neutral-100 dark:bg-neutral-900">
            <AnimatePresence mode="popLayout" initial={false}>
              <MotionImage
                key={gallery[imgIdx]}
                src={gallery[imgIdx]}
                alt={product.name}
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                loading="lazy"
                className="object-cover"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
              />
            </AnimatePresence>
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {gallery.map((g, i) => (
                <button
                  key={g + i}
                  onClick={() => setImgIdx(i)}
                  className={`border transition-colors ${i === imgIdx ? "border-foreground" : "border-border hover:border-foreground/50"}`}
                >
                  <Image
                    src={g}
                    alt=""
                    width={400}
                    height={400}
                    sizes="(max-width: 767px) 48px, 16vw"
                    className="aspect-square w-full bg-muted object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 font-mono2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {imgIdx === 0 ? "Studio photograph" : "Shown alongside the collection"}
          </p>
        </motion.div>

        {/* Info */}
        <Stagger inView={false}>
          <StaggerItem>
          <p className="label-mono">{cat?.name}</p>
          <h1 className="mt-3 font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <Stars rating={product.rating} />
            <span className="font-mono2 text-xs text-muted-foreground">
              {product.rating.toFixed(1)} · {product.reviewCount} reviews
            </span>
          </div>
          <p className="mt-6 font-mono2 text-3xl">
            {formatPrice(product.price)}
            {product.compareAt && (
              <span className="ml-3 align-middle text-base text-muted-foreground line-through">
                {formatPrice(product.compareAt)}
              </span>
            )}
          </p>

          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-foreground/85">{product.description}</p>

          </StaggerItem>

          {hasSizes && (
            <StaggerItem>
              <div className="mt-7">
                <p className="label-mono mb-3">Size — {selectedSize ?? "Choose a size"}</p>
                <div role="group" aria-label="Select size" className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <motion.button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                      whileTap={{ scale: 0.94 }}
                      className={`min-h-10 min-w-12 border px-3 text-sm transition-colors ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>
            </StaggerItem>
          )}

          {defaultColor ? (
            <StaggerItem>
            <div className="mt-7">
              <p className="label-mono mb-3">Color — {color ?? defaultColor.name}</p>
              <div className="flex gap-2.5">
                {colors.map((c) => (
                  <motion.button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    aria-label={c.name}
                    title={c.name}
                    whileTap={{ scale: 0.85 }}
                    className={`h-8 w-8 border-2 transition-all ${
                      (color ?? defaultColor.name) === c.name
                        ? "border-foreground"
                        : "border-transparent hover:border-border"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
            </StaggerItem>
          ) : null}

          {/* Qty + actions */}
          <StaggerItem>
          <div className="mt-8 flex flex-wrap items-stretch gap-3">
            <div className="flex items-center border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-full w-11 items-center justify-center hover:bg-muted" aria-label="Decrease quantity">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 overflow-hidden text-center font-mono2 text-sm">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={qty}
                    className="inline-block"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    {qty}
                  </motion.span>
                </AnimatePresence>
              </span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="flex h-full w-11 items-center justify-center hover:bg-muted" aria-label="Increase quantity">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <motion.button
              disabled={!inStock}
              whileTap={{ scale: 0.97 }}
              onClick={() => addToCart(product.id, qty, color ?? product.colors?.[0]?.name, hasSizes ? selectedSize : undefined)}
              className="btn-solid-invert flex-1 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!inStock ? "Out of stock" : `Add to cart — ${formatPrice(product.price * qty)}`}
            </motion.button>
          </div>

          <p className={`mt-4 flex items-center gap-2 font-mono2 text-[11px] uppercase tracking-[0.15em] ${low ? "text-destructive" : "text-muted-foreground"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${low ? "bg-destructive" : "bg-green-600"}`} />
            {!inStock ? "Out of stock" : low ? `Low stock — ${product.stock} remaining` : "In stock — ships within 48 hours"}
          </p>
          </StaggerItem>

          <StaggerItem>
          <div className="mt-8 grid grid-cols-3 divide-x divide-border border border-border">
            {[
              { icon: Truck, t: `Free over ${formatPrice(FREE_SHIPPING_THRESHOLD_NGN)}` },
              { icon: RotateCcw, t: "30-day returns" },
              { icon: ShieldCheck, t: "5-year guarantee" },
            ].map((s) => (
              <div key={s.t} className="flex flex-col items-center gap-2 p-4 text-center">
                <s.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="font-mono2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{s.t}</span>
              </div>
            ))}
          </div>
          <Footnote className="mt-3">
            Repaired free for five years — after that, spare parts forever.
          </Footnote>

          {/* Accordions */}
          <Accordion type="single" collapsible className="mt-8 border-t border-border">
            <AccordionItem value="story" className="border-border">
              <AccordionTrigger className="font-mono2 text-xs uppercase tracking-[0.18em] hover:no-underline">The story</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{product.story}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="specs" className="border-border">
              <AccordionTrigger className="font-mono2 text-xs uppercase tracking-[0.18em] hover:no-underline">Materials & dimensions</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                <p><span className="text-foreground">Materials — </span>{product.materials}</p>
                <p><span className="text-foreground">Dimensions — </span>{product.dimensions}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care" className="border-border">
              <AccordionTrigger className="font-mono2 text-xs uppercase tracking-[0.18em] hover:no-underline">Care</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{product.care}</AccordionContent>
            </AccordionItem>
          </Accordion>
          </StaggerItem>
        </Stagger>
      </div>

      {/* Reviews */}
      <section className="border-t border-border">
        <div className="container-x grid gap-12 py-14 lg:grid-cols-[280px_1fr]">
          <div>
            <p className="label-mono">Reviews</p>
            <p className="mt-3 font-display text-6xl font-light">{averageRating.toFixed(1)}</p>
            <Stars rating={averageRating} className="mt-2" />
            <p className="mt-2 font-mono2 text-[11px] text-muted-foreground">{reviewCount} reviews</p>
            <div className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((s) => {
                const pct = s === 5 ? 72 : s === 4 ? 21 : s === 3 ? 5 : s === 2 ? 2 : 0;
                return (
                  <div key={s} className="flex items-center gap-3 font-mono2 text-[11px] text-muted-foreground">
                    <span className="w-3">{s}</span>
                    <div className="h-1 flex-1 bg-border">
                      <motion.div
                        className="h-full bg-foreground"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, delay: 0.15 + (5 - s) * 0.08, ease: EASE }}
                      />
                    </div>
                    <span className="w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {reviews.map((r, ri) => (
              <Reveal key={r.id} delay={ri * 0.08} y={18}>
              <article className="py-7">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Stars rating={r.rating} />
                  <p className="text-sm font-medium">{r.title}</p>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                <p className="mt-3 font-mono2 text-[11px] text-muted-foreground">
                  {r.location ? `${r.author} · ${r.location}` : r.author} · {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  <ReviewVerification review={r} className="ml-2" />
                </p>
              </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="container-x py-14">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-display text-3xl font-light tracking-tight">More in {cat?.name}</h2>
              <Link href={`/categories/${product.category}`} className="link-underline font-mono2 text-xs uppercase tracking-[0.18em]">
                View category
              </Link>
            </div>
            <div className="hairline-grid sm:grid-cols-2 lg:grid-cols-4">
              {related.slice(0, 4).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} showIndex={false} />
              ))}
            </div>
          </div>
        </section>
      )}
      {/* You may also like */}
      {youMayAlsoLike.length > 0 && (
        <section className="border-t border-border">
          <div className="container-x py-14">
            <div className="mb-8 flex items-end justify-between gap-6">
              <h2 className="font-display text-3xl font-light tracking-tight">You may also like</h2>
            </div>
            <div className="hairline-grid sm:grid-cols-2 lg:grid-cols-4">
              {youMayAlsoLike.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} showIndex={false} />
              ))}
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
