import { createContext } from "react";
import type { StorefrontContactSettings } from "@/lib/storefront-contact";

export type StorefrontContactContextValue = StorefrontContactSettings & {
  displayPhone: string;
  whatsappHref: string;
  telephoneHref: string;
  applySettings: (settings: StorefrontContactSettings) => void;
};

export const StorefrontContactContext =
  createContext<StorefrontContactContextValue | null>(null);
