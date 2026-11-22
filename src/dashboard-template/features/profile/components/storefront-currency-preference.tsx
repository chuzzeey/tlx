"use client";

import { useEffect, useState } from "react";
import { IconClock, IconDeviceFloppy } from "@tabler/icons-react";
import { Button } from "@dashboard/components/ui/button";
import { useStorefrontCurrency } from "@/store/useStorefrontCurrency";
import {
  formatPrice as formatNgnPrice,
  parseStorefrontCurrencyPayload,
  isStorefrontCurrency,
  STOREFRONT_CURRENCY_OPTIONS,
  type StorefrontCurrency,
  type StorefrontCurrencyPayload,
} from "@/lib/currency";

function responseError(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "Storefront currency settings could not be loaded.";
}

export default function StorefrontCurrencyPreference() {
  const { applySettings } = useStorefrontCurrency();
  const [settings, setSettings] = useState<StorefrontCurrencyPayload | null>(null);
  const [currency, setCurrency] = useState<StorefrontCurrency>("NGN");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        const response = await fetch("/api/store/currency", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(responseError(payload));
        const nextSettings = parseStorefrontCurrencyPayload(payload);
        if (!active) return;
        setSettings(nextSettings);
        setCurrency(nextSettings.currency);
      } catch (cause) {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Storefront currency settings could not be loaded."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  async function saveCurrency() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/store/currency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(responseError(payload));
      const nextSettings = parseStorefrontCurrencyPayload(payload);
      setSettings(nextSettings);
      setCurrency(nextSettings.currency);
      applySettings(nextSettings);
      setSuccess(`Storefront prices will now display in ${nextSettings.currency}.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Storefront currency could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  const rateDescription = settings?.currency === currency
    ? currency === "NGN"
      ? "NGN is the base pricing currency."
      : `1 ${currency} ≈ ${formatNgnPrice(1 / settings.rate)}`
    : null;
  const updatedAt = settings?.rateUpdatedAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(settings.rateUpdatedAt)
      )
    : null;

  return (
    <section className="mt-10 border-t border-border pt-8" aria-labelledby="storefront-currency-heading">
      <div className="mb-5">
        <h3 id="storefront-currency-heading" className="text-sm font-semibold">
          Storefront currency
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Set the currency shown to all storefront visitors. Product prices and order calculations remain in NGN.
        </p>
      </div>

      <div className="dashboard-profile-form max-w-xl">
        <label htmlFor="storefront-currency" className="text-sm font-medium">
          Display prices in
        </label>
        <select
          id="storefront-currency"
          className="dashboard-profile-select"
          value={currency}
          disabled={loading || saving || Boolean(error && !settings)}
          onChange={(event) => {
            const nextCurrency = event.currentTarget.value;
            if (isStorefrontCurrency(nextCurrency)) {
              setCurrency(nextCurrency);
              setError(null);
              setSuccess(null);
            }
          }}
        >
          {STOREFRONT_CURRENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {loading && <p className="text-xs text-muted-foreground">Loading currency settings…</p>}
        {rateDescription && (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{rateDescription}</p>
            {updatedAt && <p>Latest rate update: {updatedAt}</p>}
          </div>
        )}
        {settings && currency !== settings.currency && (
          <p className="text-xs text-muted-foreground">
            Save to load the latest {currency} conversion rate.
          </p>
        )}
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        {success && <p role="status" className="text-xs text-green-700 dark:text-green-400">{success}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            disabled={loading || saving || Boolean(error && !settings) || !settings || currency === settings.currency}
            onClick={() => void saveCurrency()}
          >
            {saving ? <IconClock aria-hidden className="size-4 animate-pulse" /> : <IconDeviceFloppy aria-hidden className="size-4" />}
            {saving ? "Saving…" : "Save currency"}
          </Button>
        </div>
      </div>
    </section>
  );
}
