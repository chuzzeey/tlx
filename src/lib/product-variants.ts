import type { Product } from "@/data/catalog";

export const standardProductSizes = ["XS", "S", "M", "L", "XL", "XXL"];

export function normalizeCustomProductSize(value: string) {
  const normalized = value.toUpperCase();
  return /^[A-Z]{0,4}$/.test(normalized) ? normalized : null;
}

export const catalogVariantDefaults: Record<string, Pick<Product, "sizes">> = {
  sneakers: {
    sizes: ["EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"],
  },
  "seashell-bag": {
    sizes: ["One Size"],
  },
};

export function productSizeOptions(product: Pick<Product, "category" | "sizes">) {
  if (product.sizes?.length) return product.sizes;
  return product.category === "jackets" || product.category === "apparel" ? standardProductSizes : [];
}

export function defaultProductSize(product: Pick<Product, "category" | "sizes">) {
  const sizes = productSizeOptions(product);
  if (sizes.includes("M")) return "M";
  return sizes[0];
}
