"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { IconDeviceFloppy, IconPhone } from "@tabler/icons-react";
import { Button } from "@dashboard/components/ui/button";
import { Input } from "@dashboard/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@dashboard/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@dashboard/components/ui/popover";
import {
  DEFAULT_STOREFRONT_CONTACT,
  PHONE_COUNTRIES,
  formatStorefrontPhone,
  getNationalPhoneInput,
  normalizeStorefrontContact,
  parseStorefrontContactPayload,
} from "@/lib/storefront-contact";
import { useStorefrontContact } from "@/store/useStorefrontContact";
import type { CountryCode } from "libphonenumber-js";

function responseError(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "WhatsApp number settings could not be loaded.";
}

async function requestStorefrontContactSettings() {
  const response = await fetch("/api/store/contact", { cache: "no-store" });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(responseError(payload));
  return parseStorefrontContactPayload(payload);
}

export default function StorefrontWhatsAppSettings() {
  const { applySettings } = useStorefrontContact();
  const [countryCode, setCountryCode] = useState<CountryCode>(
    DEFAULT_STOREFRONT_CONTACT.countryCode,
  );
  const [phoneNumber, setPhoneNumber] = useState(() =>
    getNationalPhoneInput(
      DEFAULT_STOREFRONT_CONTACT.phoneNumber,
      DEFAULT_STOREFRONT_CONTACT.countryCode,
    ),
  );
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState(
    DEFAULT_STOREFRONT_CONTACT.phoneNumber,
  );
  const [countryOpen, setCountryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const applyLoadedSettings = useCallback((settings: ReturnType<typeof parseStorefrontContactPayload>) => {
    setCountryCode(settings.countryCode);
    setPhoneNumber(getNationalPhoneInput(settings.phoneNumber, settings.countryCode));
    setCurrentPhoneNumber(settings.phoneNumber);
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      applyLoadedSettings(await requestStorefrontContactSettings());
    } catch (cause) {
      setLoadError(
        cause instanceof Error ? cause.message : "WhatsApp number settings could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyLoadedSettings]);

  useEffect(() => {
    let active = true;
    requestStorefrontContactSettings()
      .then((settings) => {
        if (active) applyLoadedSettings(settings);
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "WhatsApp number settings could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyLoadedSettings]);

  const selectedCountry = PHONE_COUNTRIES.find(
    (country) => country.countryCode === countryCode,
  );

  async function saveNumber() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const candidate = normalizeStorefrontContact(phoneNumber, countryCode);
      const response = await fetch("/api/store/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode,
          phoneNumber: candidate.phoneNumber,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(responseError(payload));
      const settings = parseStorefrontContactPayload(payload);
      setCountryCode(settings.countryCode);
      setPhoneNumber(getNationalPhoneInput(settings.phoneNumber, settings.countryCode));
      setCurrentPhoneNumber(settings.phoneNumber);
      applySettings(settings);
      setSuccess(`WhatsApp number updated to ${formatStorefrontPhone(settings.phoneNumber)}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "WhatsApp number could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          TLX Originals · Store admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">My Number</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Set the WhatsApp contact used across your storefront, footer, and FAQ.
        </p>
      </header>

      <section
        className="max-w-3xl rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
        aria-labelledby="whatsapp-number-heading"
      >
        <div className="mb-6 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <IconPhone aria-hidden className="size-5" />
          </span>
          <div>
            <h2 id="whatsapp-number-heading" className="font-semibold">
              WhatsApp number
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Changing this number updates WhatsApp and call links throughout the customer-facing store.
            </p>
          </div>
        </div>

        {loadError ? (
          <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <p role="alert" className="text-sm text-destructive">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLoading(true);
                setLoadError(null);
                void loadSettings();
              }}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <label className="text-sm font-medium" id="whatsapp-country-label">
                  Country
                </label>
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        aria-labelledby="whatsapp-country-label"
                        disabled={loading || saving}
                        className="w-full justify-between font-normal"
                      />
                    }
                  >
                    <span className="truncate">{selectedCountry?.name ?? countryCode}</span>
                    <span className="ml-auto mr-2 text-muted-foreground">
                      {selectedCountry?.callingCode}
                    </span>
                    <ChevronsUpDown aria-hidden className="size-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search countries or calling codes…" />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {PHONE_COUNTRIES.map((country) => (
                            <CommandItem
                              key={country.countryCode}
                              value={`${country.name} ${country.callingCode} ${country.countryCode}`}
                              onSelect={() => {
                                if (country.countryCode !== countryCode) {
                                  setPhoneNumber("");
                                }
                                setCountryCode(country.countryCode);
                                setCountryOpen(false);
                                setError(null);
                                setSuccess(null);
                              }}
                            >
                              <span className="min-w-0 flex-1 truncate">{country.name}</span>
                              <span className="text-muted-foreground">{country.callingCode}</span>
                              {country.countryCode === countryCode && (
                                <Check aria-hidden className="ml-2 size-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label htmlFor="whatsapp-phone-number" className="text-sm font-medium">
                  WhatsApp number
                </label>
                <div className="flex h-10 items-center overflow-hidden rounded-md border border-input bg-background">
                  <span className="flex h-full shrink-0 items-center border-r border-input px-3 text-sm text-muted-foreground">
                    {selectedCountry?.callingCode ?? ""}
                  </span>
                  <Input
                    id="whatsapp-phone-number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={phoneNumber}
                    disabled={loading || saving}
                    onChange={(event) => {
                      setPhoneNumber(event.currentTarget.value);
                      setError(null);
                      setSuccess(null);
                    }}
                    placeholder="Enter phone number"
                    className="h-full rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Current public number: {formatStorefrontPhone(currentPhoneNumber)}
            </p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {success && <p role="status" className="text-sm text-green-700 dark:text-green-400">{success}</p>}

            <div className="flex justify-end border-t border-border pt-4">
              <Button
                type="button"
                disabled={loading || saving || !phoneNumber.trim()}
                onClick={() => void saveNumber()}
              >
                <IconDeviceFloppy aria-hidden className="size-4" />
                {saving ? "Saving…" : "Save number"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
