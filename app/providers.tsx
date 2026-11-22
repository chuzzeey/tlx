"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/store/ThemeContext";
import { ShopProvider } from "@/store/ShopContext";
import { CatalogProvider } from "@/store/CatalogContext";
import { StorefrontCurrencyProvider } from "@/store/StorefrontCurrencyContext";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CatalogProvider>
        <StorefrontCurrencyProvider>
          <ShopProvider>
            {children}
            <Toaster position="bottom-right" />
          </ShopProvider>
        </StorefrontCurrencyProvider>
      </CatalogProvider>
    </ThemeProvider>
  );
}
