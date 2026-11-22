import { NextResponse } from "next/server";
import { isStorefrontCurrency } from "@/lib/currency";
import { verifyStoreAdmin } from "@dashboard/lib/admin-auth";
import { fetchStorefrontExchangeRates, getStorefrontCurrency } from "@dashboard/lib/storefront-currency-service";
import {
  createAdminSupabaseClient,
  isSupabaseAdminConfigured,
  isSupabaseCatalogConfigured,
} from "@dashboard/lib/supabase-server";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "PGRST205" || error.code === "42P01")
  ) {
    return "Store currency settings are not installed. Review and run the storefront currency migration.";
  }
  return error instanceof Error ? error.message : "Storefront currency settings could not be loaded.";
}

export async function GET() {
  if (!isSupabaseCatalogConfigured) {
    return NextResponse.json(
      { currency: "NGN", rate: 1, rateUpdatedAt: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const settings = await getStorefrontCurrency();
    return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = errorMessage(error);
    console.error("Could not load storefront currency settings.", message);
    return NextResponse.json(
      { error: message },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function PATCH(request: Request) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    const message =
      access.status === 401
        ? "Sign in to update storefront currency."
        : access.status === 403
          ? "You are not authorized to update storefront currency."
          : "Admin authentication is unavailable.";
    return NextResponse.json({ error: message }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase admin access is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const currency =
    typeof body === "object" && body !== null && "currency" in body
      ? body.currency
      : undefined;
  if (!isStorefrontCurrency(currency)) {
    return NextResponse.json(
      { error: "Choose USD, EUR, JPY, CNY, NGN, or GHS." },
      { status: 400 }
    );
  }

  let rate = 1;
  let rateUpdatedAt: string | null = null;
  if (currency !== "NGN") {
    try {
      const exchangeRates = await fetchStorefrontExchangeRates();
      rate = exchangeRates.rates[currency];
      rateUpdatedAt = exchangeRates.rateUpdatedAt;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The latest exchange rates could not be loaded.";
      console.error("Could not load exchange rates before saving storefront currency.", message);
      return NextResponse.json({ error: message }, { status: 503 });
    }
  }

  const { data, error } = await createAdminSupabaseClient()
    .from("storefront_settings")
    .update({ currency })
    .eq("id", 1)
    .select("currency")
    .single();

  if (error || !data || !isStorefrontCurrency(data.currency)) {
    const message = errorMessage(error ?? new Error("Store currency settings row was not found."));
    console.error("Could not save storefront currency settings.", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }

  return NextResponse.json(
    {
      currency: data.currency,
      rate,
      rateUpdatedAt,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
