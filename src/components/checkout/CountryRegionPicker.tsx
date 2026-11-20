"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const API_BASE = "https://countriesnow.space/api/v0.1/countries";

interface CountryOption {
  apiName: string;
  name: string;
}

interface StateLookup {
  country: string;
  status: "ready" | "error";
  states: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCountries(payload: unknown): CountryOption[] {
  if (!isRecord(payload) || payload.error !== false || !Array.isArray(payload.data)) {
    throw new Error("The country response was invalid.");
  }

  const countries = payload.data.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.name !== "string" || !entry.name.trim()) return [];
    return [{
      apiName: entry.name,
      name: entry.name.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
    }];
  });

  if (countries.length === 0) throw new Error("The country response contained no countries.");
  return countries.sort((a, b) => a.name.localeCompare(b.name));
}

function parseStates(payload: unknown): string[] {
  if (
    !isRecord(payload) ||
    payload.error !== false ||
    !isRecord(payload.data) ||
    !Array.isArray(payload.data.states)
  ) {
    throw new Error("The state response was invalid.");
  }

  return payload.data.states.flatMap((entry) =>
    isRecord(entry) && typeof entry.name === "string" ? [entry.name] : []
  );
}

export default function CountryRegionPicker({
  country,
  region,
  onCountryChange,
  onRegionChange,
}: {
  country: string;
  region: string;
  onCountryChange: (country: string) => void;
  onRegionChange: (region: string) => void;
}) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countryStatus, setCountryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [countryRetry, setCountryRetry] = useState(0);
  const [countryOpen, setCountryOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionRetry, setRegionRetry] = useState(0);
  const [regionLookup, setRegionLookup] = useState<StateLookup | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCountries() {
      try {
        const response = await fetch(`${API_BASE}/positions`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Country lookup failed with status ${response.status}.`);
        const options = parseCountries(await response.json());
        setCountries(options);
        setCountryStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Unable to load checkout countries.", error);
        setCountryStatus("error");
      }
    }

    void loadCountries();
    return () => controller.abort();
  }, [countryRetry]);

  const selectedCountry = countries.find((option) => option.name === country);
  const apiCountry = selectedCountry?.apiName ?? country;

  useEffect(() => {
    if (!apiCountry || countryStatus === "loading") return;
    const controller = new AbortController();

    async function loadRegions() {
      try {
        const response = await fetch(
          `${API_BASE}/states/q?country=${encodeURIComponent(apiCountry)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } }
        );
        if (!response.ok) throw new Error(`State lookup failed with status ${response.status}.`);
        const states = parseStates(await response.json());
        setRegionLookup({ country: apiCountry, status: "ready", states });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(`Unable to load states for ${country}.`, error);
        setRegionLookup({ country: apiCountry, status: "error", states: [] });
      }
    }

    void loadRegions();
    return () => controller.abort();
  }, [apiCountry, country, countryStatus, regionRetry]);

  const currentLookup = regionLookup?.country === apiCountry ? regionLookup : null;
  const regionStatus = currentLookup?.status ?? "loading";
  const regions = currentLookup?.states ?? [];

  return (
    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <div className="space-y-2">
        <p id="checkout-country-label" className="label-mono">Country</p>
        {countryStatus === "error" ? (
          <>
            <input
              aria-labelledby="checkout-country-label"
              value={country}
              onChange={(event) => {
                onCountryChange(event.target.value);
                onRegionChange("");
              }}
              placeholder="Enter country"
              className="input-plain h-12 rounded-2xl"
            />
            <p role="alert" className="text-xs text-destructive">
              Couldn&apos;t load countries. Enter one manually or{" "}
              <button
                type="button"
                onClick={() => {
                  setCountryStatus("loading");
                  setCountryRetry((retry) => retry + 1);
                }}
                className="underline underline-offset-2"
              >
                try again
              </button>.
            </p>
          </>
        ) : (
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-labelledby="checkout-country-label"
                aria-expanded={countryOpen}
                disabled={countryStatus === "loading"}
                className="input-plain flex h-12 items-center justify-between rounded-2xl border-neutral-200 bg-background/80 text-left transition-colors hover:border-foreground/25 focus:border-border focus-visible:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10 data-[state=open]:border-border disabled:opacity-60 dark:border-border dark:bg-muted/30"
              >
                <span className="truncate">{countryStatus === "loading" ? "Loading countries…" : country || "Choose a country"}</span>
                {countryStatus === "loading"
                  ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                  : <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              avoidCollisions={false}
              align="start"
              sideOffset={8}
              className="w-[var(--radix-popover-trigger-width)] rounded-2xl border-neutral-200 bg-background/95 p-1 shadow-xl backdrop-blur-md dark:border-border"
            >
              <Command className="rounded-xl bg-transparent [&_[data-slot=command-input-wrapper]]:border-border/70">
                <CommandInput
                  placeholder="Search countries..."
                  aria-label="Search countries"
                  className="outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {countries.map((option) => (
                      <CommandItem
                        key={option.apiName}
                        value={option.name}
                        onSelect={() => {
                          onCountryChange(option.name);
                          onRegionChange("");
                          setCountryOpen(false);
                        }}
                        className="rounded-xl px-3 py-2.5 text-foreground hover:bg-neutral-100 hover:text-foreground data-[selected=true]:bg-neutral-100 data-[selected=true]:text-foreground dark:hover:bg-muted dark:data-[selected=true]:bg-muted"
                      >
                        <Check className={`h-4 w-4 ${country === option.name ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
                        {option.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="space-y-2">
        <p id="checkout-region-label" className="label-mono">State / region</p>
        {regionStatus === "ready" && regions.length > 0 ? (
          <Popover open={regionOpen} onOpenChange={setRegionOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-labelledby="checkout-region-label"
                aria-expanded={regionOpen}
                className="input-plain flex h-12 items-center justify-between rounded-2xl border-neutral-200 bg-background/80 text-left transition-colors hover:border-foreground/25 focus:border-border focus-visible:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10 data-[state=open]:border-border dark:border-border dark:bg-muted/30"
              >
                <span className="truncate">{region || "Choose a state or region"}</span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              avoidCollisions={false}
              align="start"
              sideOffset={8}
              className="w-[var(--radix-popover-trigger-width)] rounded-2xl border-neutral-200 bg-background/95 p-1 shadow-xl backdrop-blur-md dark:border-border"
            >
              <Command className="rounded-xl bg-transparent [&_[data-slot=command-input-wrapper]]:border-border/70">
                <CommandInput
                  placeholder="Search states or regions..."
                  aria-label="Search states or regions"
                  className="outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <CommandList>
                  <CommandEmpty>No state or region found.</CommandEmpty>
                  <CommandGroup>
                    {regions.map((name) => (
                      <CommandItem
                        key={name}
                        value={name}
                        onSelect={() => {
                          onRegionChange(name);
                          setRegionOpen(false);
                        }}
                        className="rounded-xl px-3 py-2.5 text-foreground hover:bg-neutral-100 hover:text-foreground data-[selected=true]:bg-neutral-100 data-[selected=true]:text-foreground dark:hover:bg-muted dark:data-[selected=true]:bg-muted"
                      >
                        <Check className={`h-4 w-4 ${region === name ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
                        {name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <>
            <input
              aria-labelledby="checkout-region-label"
              value={region}
              onChange={(event) => onRegionChange(event.target.value)}
              placeholder={regionStatus === "loading" ? "Loading states…" : "Enter state or region"}
              disabled={regionStatus === "loading"}
              className="input-plain h-12 rounded-2xl disabled:opacity-60"
            />
            {regionStatus === "loading" ? (
              <p className="text-xs text-muted-foreground">Loading regions for {country}…</p>
            ) : regionStatus === "error" ? (
              <p role="alert" className="text-xs text-destructive">
                Couldn&apos;t load regions. Enter one manually or{" "}
                <button
                  type="button"
                  onClick={() => {
                    setRegionLookup(null);
                    setRegionRetry((retry) => retry + 1);
                  }}
                  className="underline underline-offset-2"
                >
                  try again
                </button>.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No regions listed for this country. Enter one manually.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
