export function isProductInStock(product: { inStock?: boolean; stock: number }) {
  return product.inStock ?? product.stock > 0;
}
