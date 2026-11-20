import type { Review } from "@/data/catalog";

export interface CustomerReview extends Review {
  orderId: string;
  productId: string;
}

const STORAGE_KEY = "aurelle-customer-reviews";

function isCustomerReview(value: unknown): value is CustomerReview {
  if (!value || typeof value !== "object") return false;
  const review = value as Partial<CustomerReview>;
  return (
    typeof review.id === "string" &&
    typeof review.orderId === "string" &&
    typeof review.productId === "string" &&
    typeof review.author === "string" &&
    typeof review.location === "string" &&
    typeof review.rating === "number" &&
    review.rating >= 1 &&
    review.rating <= 5 &&
    typeof review.date === "string" &&
    typeof review.title === "string" &&
    typeof review.body === "string" &&
    typeof review.verified === "boolean"
  );
}

export function readCustomerReviews(): CustomerReview[] {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed) || !parsed.every(isCustomerReview)) {
    throw new Error("Saved customer reviews have an invalid format.");
  }
  return parsed;
}

export function saveCustomerReview(review: CustomerReview): CustomerReview[] {
  const reviews = readCustomerReviews();
  const next = [
    review,
    ...reviews.filter((saved) => !(saved.productId === review.productId && saved.orderId === review.orderId)),
  ];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
