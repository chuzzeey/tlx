"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/store/ThemeContext";
import { ShopProvider } from "@/store/ShopContext";
import { CatalogProvider } from "@/store/CatalogContext";
import { StorefrontCurrencyProvider } from "@/store/StorefrontCurrencyContext";
import { StorefrontContactProvider } from "@/store/StorefrontContactContext";
import { Toaster } from "@/components/ui/sonner";
import OfflineNotice from "@/components/layout/OfflineNotice";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CatalogProvider>
        <StorefrontCurrencyProvider>
          <StorefrontContactProvider>
            <ShopProvider>
              {children}
              <Toaster position="top-center" />
              <OfflineNotice />
            </ShopProvider>
          </StorefrontContactProvider>
        </StorefrontCurrencyProvider>
      </CatalogProvider>
    </ThemeProvider>
  );
}
