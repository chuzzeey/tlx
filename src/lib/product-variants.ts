import type { Product } from "@/data/catalog";

const apparelSizes = ["S", "M", "L", "XL", "XXL"];

export const catalogVariantDefaults: Record<string, Pick<Product, "sizes" | "colors">> = {
  sneakers: {
    sizes: ["EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"],
    colors: [
      { name: "Sky Blue", hex: "#78B8E3" },
      { name: "White", hex: "#F1F1EE" },
    ],
  },
  "seashell-bag": {
    sizes: ["One Size"],
    colors: [
      { name: "Burgundy", hex: "#5B1028" },
      { name: "Black", hex: "#242323" },
    ],
  },
};

export function productSizeOptions(product: Pick<Product, "category" | "sizes">) {
  if (product.sizes?.length) return product.sizes;
  return product.category === "jackets" || product.category === "apparel" ? apparelSizes : [];
}

export function defaultProductSize(product: Pick<Product, "category" | "sizes">) {
  const sizes = productSizeOptions(product);
  if (sizes.includes("M")) return "M";
  return sizes[0];
}
