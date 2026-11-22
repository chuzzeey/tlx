import assert from "node:assert/strict";
import test from "node:test";
import {
  formatStorefrontPrice,
  parseNgnExchangeRatePayload,
  parseStorefrontCurrencyPayload,
} from "../src/lib/currency.ts";

const rates = {
  USD: 1 / 1350,
  EUR: 0.00062,
  JPY: 0.11,
  CNY: 0.0052,
  NGN: 1,
  GHS: 0.0093,
};

test("formats prices in the selected currency without changing NGN formatting", () => {
  assert.equal(formatStorefrontPrice(1350, "USD", rates.USD), "USD 1.00");
  assert.equal(formatStorefrontPrice(1350, "NGN", rates.NGN), "₦1,350");
});

test("requires a valid rate when formatting a non-NGN price", () => {
  assert.throws(
    () => formatStorefrontPrice(1350, "USD", null),
    /exchange rate for USD is unavailable/i
  );
});

test("validates the provider response and requires every supported currency", () => {
  const providerResponse = {
    result: "success",
    base_code: "NGN",
    time_last_update_utc: "Fri, 02 Apr 2020 00:06:37 +0000",
    rates,
  };
  assert.deepEqual(parseNgnExchangeRatePayload(providerResponse).rates, rates);
  assert.throws(
    () => parseNgnExchangeRatePayload({ ...providerResponse, rates: { ...rates, GHS: undefined } }),
    /valid GHS rate/i
  );
});

test("validates currency settings received by the storefront", () => {
  const payload = {
    currency: "EUR",
    rate: rates.EUR,
    rateUpdatedAt: "2026-11-22T00:00:00.000Z",
  };
  assert.equal(parseStorefrontCurrencyPayload(payload).currency, "EUR");
  assert.throws(
    () => parseStorefrontCurrencyPayload({ ...payload, currency: "GBP" }),
    /response was invalid/i
  );
  assert.equal(
    parseStorefrontCurrencyPayload({
      currency: "NGN",
      rate: 1,
      rateUpdatedAt: null,
    }).rate,
    1
  );
});
