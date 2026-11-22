import { NextResponse } from "next/server";
import {
  DEFAULT_STOREFRONT_CONTACT,
  normalizeStorefrontContact,
  parseStorefrontContactPayload,
} from "@/lib/storefront-contact";
import { verifyStoreAdmin } from "@dashboard/lib/admin-auth";
import {
  createAdminSupabaseClient,
  createPublicSupabaseClient,
  isSupabaseAdminConfigured,
  isSupabaseCatalogConfigured,
} from "@dashboard/lib/supabase-server";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "PGRST204" ||
      error.code === "PGRST205" ||
      error.code === "42703" ||
      error.code === "42P01")
  ) {
    return "WhatsApp contact settings are not installed. Apply the storefront WhatsApp number migration.";
  }
  return error instanceof Error ? error.message : "WhatsApp contact settings could not be loaded.";
}

export async function GET() {
  if (!isSupabaseCatalogConfigured) {
    return NextResponse.json(DEFAULT_STOREFRONT_CONTACT, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { data, error } = await createPublicSupabaseClient()
    .from("storefront_settings")
    .select("whatsapp_country, whatsapp_phone")
    .eq("id", 1)
    .single();

  if (error || !data) {
    const message = errorMessage(error ?? new Error("Store contact settings were not found."));
    console.error("Could not load storefront WhatsApp contact settings.", message);
    return NextResponse.json(
      { error: message },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const settings = parseStorefrontContactPayload({
      countryCode: data.whatsapp_country,
      phoneNumber: data.whatsapp_phone,
    });
    return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = errorMessage(error);
    console.error("Storefront WhatsApp contact settings are invalid.", message);
    return NextResponse.json(
      { error: message },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PATCH(request: Request) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    const message =
      access.status === 401
        ? "Sign in to update the WhatsApp number."
        : access.status === 403
          ? "You are not authorized to update the WhatsApp number."
          : "Admin authentication is unavailable.";
    return NextResponse.json({ error: message }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase admin access is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const phoneNumber =
    typeof body === "object" && body !== null && "phoneNumber" in body
      ? body.phoneNumber
      : undefined;
  const countryCode =
    typeof body === "object" && body !== null && "countryCode" in body
      ? body.countryCode
      : undefined;

  let settings;
  try {
    settings = normalizeStorefrontContact(phoneNumber, countryCode);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enter a valid WhatsApp number." },
      { status: 400 },
    );
  }

  const { data, error } = await createAdminSupabaseClient()
    .from("storefront_settings")
    .update({
      whatsapp_country: settings.countryCode,
      whatsapp_phone: settings.phoneNumber,
    })
    .eq("id", 1)
    .select("whatsapp_country, whatsapp_phone")
    .single();

  if (error || !data) {
    const message = errorMessage(error ?? new Error("Store contact settings were not found."));
    console.error("Could not save storefront WhatsApp contact settings.", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }

  try {
    const savedSettings = parseStorefrontContactPayload({
      countryCode: data.whatsapp_country,
      phoneNumber: data.whatsapp_phone,
    });
    return NextResponse.json(savedSettings, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = errorMessage(error);
    console.error("Saved storefront WhatsApp contact settings are invalid.", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
