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

export const STOREFRONT_CURRENCIES = ["USD", "EUR", "JPY", "CNY", "NGN", "GHS"] as const;

export type StorefrontCurrency = (typeof STOREFRONT_CURRENCIES)[number];
export type StorefrontExchangeRates = Record<StorefrontCurrency, number>;

export const STOREFRONT_CURRENCY_OPTIONS: {
  value: StorefrontCurrency;
  label: string;
}[] = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "CNY", label: "CNY — Chinese Yuan" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
];

export type StorefrontCurrencyPayload = {
  currency: StorefrontCurrency;
  rate: number;
  rateUpdatedAt: string | null;
};

export type StorefrontExchangeRatePayload = {
  rates: StorefrontExchangeRates;
  rateUpdatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function requiredRate(rates: Record<string, unknown>, currency: StorefrontCurrency): number {
  const rate = rates[currency];
  if (!isPositiveRate(rate)) {
    throw new Error(`The exchange-rate response did not include a valid ${currency} rate.`);
  }
  return rate;
}

export function isStorefrontCurrency(value: unknown): value is StorefrontCurrency {
  return (
    typeof value === "string" &&
    STOREFRONT_CURRENCIES.some((currency) => currency === value)
  );
}

export function parseNgnExchangeRatePayload(
  value: unknown
): StorefrontExchangeRatePayload {
  if (
    !isRecord(value) ||
    value.result !== "success" ||
    value.base_code !== "NGN" ||
    !isRecord(value.rates)
  ) {
    throw new Error("The exchange-rate provider returned an invalid NGN rate response.");
  }

  const rates: StorefrontExchangeRates = {
    USD: requiredRate(value.rates, "USD"),
    EUR: requiredRate(value.rates, "EUR"),
    JPY: requiredRate(value.rates, "JPY"),
    CNY: requiredRate(value.rates, "CNY"),
    NGN: requiredRate(value.rates, "NGN"),
    GHS: requiredRate(value.rates, "GHS"),
  };
  if (rates.NGN !== 1) {
    throw new Error("The exchange-rate provider returned an unexpected NGN base rate.");
  }

  const updatedAt =
    typeof value.time_last_update_utc === "string"
      ? new Date(value.time_last_update_utc)
      : null;
  if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
    throw new Error("The exchange-rate provider returned an invalid update time.");
  }

  return { rates, rateUpdatedAt: updatedAt.toISOString() };
}

export function parseStorefrontCurrencyPayload(value: unknown): StorefrontCurrencyPayload {
  if (
    !isRecord(value) ||
    !isStorefrontCurrency(value.currency) ||
    !isPositiveRate(value.rate)
  ) {
    throw new Error("The storefront currency response was invalid.");
  }
  if (value.currency === "NGN" && value.rate !== 1) {
    throw new Error("The storefront currency response contained an invalid NGN base rate.");
  }

  if (value.rateUpdatedAt === null && value.currency === "NGN") {
    return { currency: value.currency, rate: value.rate, rateUpdatedAt: null };
  }
  const updatedAt =
    typeof value.rateUpdatedAt === "string" ? new Date(value.rateUpdatedAt) : null;
  if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
    throw new Error("The storefront currency response did not include a valid rate update time.");
  }

  return {
    currency: value.currency,
    rate: value.rate,
    rateUpdatedAt: updatedAt.toISOString(),
  };
}

export function formatStorefrontPrice(
  amountInNgn: number,
  currency: StorefrontCurrency,
  rate: number | null
): string {
  if (currency === "NGN") return formatPrice(amountInNgn);
  if (!Number.isFinite(amountInNgn)) {
    throw new Error("Cannot format a non-finite storefront price.");
  }
  if (!isPositiveRate(rate)) {
    throw new Error(`The exchange rate for ${currency} is unavailable.`);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amountInNgn * rate);
}
