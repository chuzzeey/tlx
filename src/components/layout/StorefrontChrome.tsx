"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import NavigationEffects from "@/components/layout/NavigationEffects";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useStorefrontContact } from "@/store/useStorefrontContact";

export default function StorefrontChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { whatsappHref } = useStorefrontContact();
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/auth");

  if (isDashboardRoute) return children;

  return (
    <>
      <NavigationEffects />
      <div className="flex min-h-screen flex-col">
        <Header />
        {children}
        <Footer />
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with TLX Originals on WhatsApp"
          title="Chat with us on WhatsApp"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366] md:bottom-6 md:right-6"
        >
          <WhatsAppIcon className="size-7" />
        </a>
      </div>
    </>
  );
}
