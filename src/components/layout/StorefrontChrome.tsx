"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import NavigationEffects from "@/components/layout/NavigationEffects";

export default function StorefrontChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/auth");

  if (isDashboardRoute) return children;

  return (
    <>
      <NavigationEffects />
      <div className="flex min-h-screen flex-col">
        <Header />
        {children}
        <Footer />
      </div>
    </>
  );
}
