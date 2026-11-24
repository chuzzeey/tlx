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
import {
  DEFAULT_STOREFRONT_CONTACT,
  formatStorefrontPhone,
  getTelephoneHref,
  getWhatsAppHref,
  parseStorefrontContactPayload,
  type StorefrontContactSettings,
} from "@/lib/storefront-contact";
import { StorefrontContactContext } from "./storefront-contact-context";

const CONTACT_CHANNEL_NAME = "tlx-storefront-contact";

function responseError(payload: unknown) {
  return typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : "WhatsApp contact settings could not be loaded.";
}

export function StorefrontContactProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<StorefrontContactSettings>(
    DEFAULT_STOREFRONT_CONTACT,
  );
  const refreshOnStorefront = useRef(true);
  const contactChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CONTACT_CHANNEL_NAME);
    contactChannel.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      try {
        setSettings(parseStorefrontContactPayload(event.data));
      } catch (error) {
        console.error(
          "Could not apply a WhatsApp contact update from another tab.",
          error instanceof Error ? error.message : "The update payload was invalid.",
        );
      }
    };

    return () => {
      channel.close();
      contactChannel.current = null;
    };
  }, []);

  const applySettings = useCallback((nextSettings: StorefrontContactSettings) => {
    setSettings(nextSettings);
    contactChannel.current?.postMessage(nextSettings);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) {
      refreshOnStorefront.current = true;
      return;
    }
    if (!refreshOnStorefront.current) return;

    let active = true;
    async function loadSettings() {
      try {
        const response = await fetch("/api/store/contact", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(responseError(payload));
        const nextSettings = parseStorefrontContactPayload(payload);
        if (!active) return;
        refreshOnStorefront.current = false;
        setSettings(nextSettings);
      } catch (error) {
        if (!active) return;
        refreshOnStorefront.current = false;
        const message =
          error instanceof Error ? error.message : "WhatsApp contact settings could not be loaded.";
        console.error("Could not load storefront WhatsApp contact settings.", message);
        if (navigator.onLine) {
          toast.error("Contact settings could not be updated.", {
            description: "Showing the last available contact details. Please try again later.",
          });
        }
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, [pathname]);

  const value = useMemo(
    () => ({
      ...settings,
      displayPhone: formatStorefrontPhone(settings.phoneNumber, settings.countryCode),
      whatsappHref: getWhatsAppHref(settings.phoneNumber),
      telephoneHref: getTelephoneHref(settings.phoneNumber),
      applySettings,
    }),
    [applySettings, settings],
  );

  return (
    <StorefrontContactContext.Provider value={value}>
      {children}
    </StorefrontContactContext.Provider>
  );
}
