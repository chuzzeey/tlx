"use client";

import { useContext } from "react";
import { StorefrontCurrencyContext } from "./storefront-currency-context";

export function useStorefrontCurrency() {
  const context = useContext(StorefrontCurrencyContext);
  if (!context) {
    throw new Error("useStorefrontCurrency must be used within StorefrontCurrencyProvider");
  }
  return context;
}
