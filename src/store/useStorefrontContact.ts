"use client";

import { useContext } from "react";
import { StorefrontContactContext } from "./storefront-contact-context";

export function useStorefrontContact() {
  const context = useContext(StorefrontContactContext);
  if (!context) {
    throw new Error("useStorefrontContact must be used within StorefrontContactProvider");
  }
  return context;
}
