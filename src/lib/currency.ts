const ngnFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const LEGACY_PRICE_USD_TO_NGN_RATE = 1354.04;

export function formatPrice(amountInNgn: number): string {
  return ngnFormatter.format(amountInNgn);
}

export function legacyUsdPriceToNgn(price: number): number {
  return Math.round(price * LEGACY_PRICE_USD_TO_NGN_RATE);
}
