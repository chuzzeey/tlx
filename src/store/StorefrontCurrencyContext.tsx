"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { StorefrontCurrencyContext } from "./storefront-currency-context";
import {
  formatStorefrontPrice,
  parseStorefrontCurrencyPayload,
  type StorefrontCurrency,
  type StorefrontCurrencyPayload,
} from "@/lib/currency";

const CURRENCY_CHANNEL_NAME = "tlx-storefront-currency";

export function StorefrontCurrencyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [currency, setCurrency] = useState<StorefrontCurrency>("NGN");
  const [rate, setRate] = useState<number | null>(null);
  const refreshOnStorefront = useRef(true);
  const currencyChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CURRENCY_CHANNEL_NAME);
    currencyChannel.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      try {
        const settings = parseStorefrontCurrencyPayload(event.data);
        setCurrency(settings.currency);
        setRate(settings.rate);
      } catch (error) {
        console.error(
          "Could not apply a storefront currency update from another tab.",
          error instanceof Error ? error.message : "The update payload was invalid."
        );
      }
    };

    return () => {
      channel.close();
      currencyChannel.current = null;
    };
  }, []);

  const applySettings = useCallback((settings: StorefrontCurrencyPayload) => {
    setCurrency(settings.currency);
    setRate(settings.rate);
    currencyChannel.current?.postMessage(settings);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) {
      refreshOnStorefront.current = true;
      return;
    }
    if (!refreshOnStorefront.current) return;

    let active = true;
    async function loadCurrency() {
      try {
        const response = await fetch("/api/store/currency", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "The storefront currency could not be loaded.";
          throw new Error(message);
        }

        const settings = parseStorefrontCurrencyPayload(payload);
        if (!active) return;
        refreshOnStorefront.current = false;
        setCurrency(settings.currency);
        setRate(settings.rate);
      } catch (error) {
        if (!active) return;
        refreshOnStorefront.current = false;
        const message =
          error instanceof Error ? error.message : "The storefront currency could not be loaded.";
        setCurrency("NGN");
        setRate(null);
        console.error("Could not load storefront currency settings.", message);
        toast.error("Showing prices in NGN", {
          description: `Storefront currency settings could not be loaded. ${message}`,
        });
      }
    }

    void loadCurrency();
    return () => {
      active = false;
    };
  }, [pathname]);

  const formatPrice = useCallback(
    (amountInNgn: number) => formatStorefrontPrice(amountInNgn, currency, rate),
    [currency, rate]
  );
  const value = useMemo(
    () => ({ currency, rate, formatPrice, applySettings }),
    [currency, rate, formatPrice, applySettings]
  );

  return (
    <StorefrontCurrencyContext.Provider value={value}>
      {children}
    </StorefrontCurrencyContext.Provider>
  );
}
