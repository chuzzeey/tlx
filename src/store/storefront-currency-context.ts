import { createContext } from "react";
import type { StorefrontCurrency, StorefrontCurrencyPayload } from "@/lib/currency";

export type StorefrontCurrencyContextValue = {
  currency: StorefrontCurrency;
  rate: number | null;
  formatPrice: (amountInNgn: number) => string;
  applySettings: (settings: StorefrontCurrencyPayload) => void;
};

export const StorefrontCurrencyContext =
  createContext<StorefrontCurrencyContextValue | null>(null);
