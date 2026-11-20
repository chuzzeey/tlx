import { cardReviewCount, products, type Product } from "@/data/catalog";

export type SearchItem = {
  id: string;
  name: string;
  image: string;
  href: string;
  rating?: number;
  reviewCount?: number;
  price?: number;
  product?: Product;
};

const recommendedProductIds = new Set([
  "stussy-jacket",
  "mwdbl-jacket",
  "chaotic-club",
  "sneakers",
  "seashell-bag",
  "mens-golf-cap",
]);

export const recommendedItems: SearchItem[] = products
  .filter((product) => recommendedProductIds.has(product.id))
  .map((product) => ({
      id: product.id,
      name: product.name,
      image: product.image,
      href: `/products/${product.id}`,
      rating: product.rating,
      reviewCount: cardReviewCount(product),
      price: product.price,
      product,
  }));

export function shuffleRecommendations(items: SearchItem[], previousOrder: SearchItem[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  if (shuffled.length > 1 && shuffled.every((item, index) => item.id === previousOrder[index]?.id)) {
    const first = shuffled.shift();
    if (first) shuffled.push(first);
  }
  return shuffled;
}
