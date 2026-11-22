import "server-only";

import {
  isStorefrontCurrency,
  parseNgnExchangeRatePayload,
  type StorefrontCurrencyPayload,
} from "@/lib/currency";
import { createPublicSupabaseClient } from "./supabase-server";

const EXCHANGE_RATE_URL = "https://open.er-api.com/v6/latest/NGN";

export async function fetchStorefrontExchangeRates() {
  const response = await fetch(EXCHANGE_RATE_URL, {
    next: { revalidate: 86400 },
  });
  if (!response.ok) {
    throw new Error(`Exchange-rate service returned HTTP ${response.status}.`);
  }

  return parseNgnExchangeRatePayload(await response.json());
}

export async function getStorefrontCurrency(): Promise<StorefrontCurrencyPayload> {
  const { data, error } = await createPublicSupabaseClient()
    .from("storefront_settings")
    .select("currency")
    .eq("id", 1)
    .single();

  if (error) {
    const failure = new Error(error.message);
    Object.assign(failure, { code: error.code });
    throw failure;
  }
  if (!data || !isStorefrontCurrency(data.currency)) {
    throw new Error("Storefront currency settings are missing or invalid.");
  }
  if (data.currency === "NGN") {
    return { currency: "NGN", rate: 1, rateUpdatedAt: null };
  }

  const exchangeRates = await fetchStorefrontExchangeRates();
  return {
    currency: data.currency,
    rate: exchangeRates.rates[data.currency],
    rateUpdatedAt: exchangeRates.rateUpdatedAt,
  };
}
