import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/layout/Header";
import NavigationEffects from "@/components/layout/NavigationEffects";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, organizationJsonLd } from "@/lib/seo";

const satoshi = localFont({
  src: [
    { path: "./fonts/satoshi-medium.woff2", weight: "500" },
    { path: "./fonts/satoshi-bold.woff2", weight: "700" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TLX Originals — No Hype. Just Motion!",
    template: "%s — TLX Originals",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "TLX Originals",
    "streetwear",
    "jackets",
    "T-shirts",
    "shoes",
    "bags",
    "accessories",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "TLX Originals — No Hype. Just Motion!",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/images/hero/hero-main.webp", width: 1200, height: 800, alt: "TLX Originals" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TLX Originals — No Hype. Just Motion!",
    description: SITE_DESCRIPTION,
    images: ["/images/hero/hero-main.webp"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={satoshi.variable}
    >
      <body>
        {/* Applies the saved theme before first paint, including browser chrome colors. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{const theme=localStorage.getItem("aurelle-theme")==="dark"?"dark":"light";const root=document.documentElement;root.classList.toggle("dark",theme==="dark");root.style.colorScheme=theme;document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme==="dark"?"#10100f":"#ffffff")}catch(e){}`}
        </Script>
        <Providers>
          <NavigationEffects />
          <div className="flex min-h-screen flex-col">
            <Header />
            {children}
            <Footer />
          </div>
        </Providers>
        <JsonLd data={organizationJsonLd()} />
      </body>
    </html>
  );
}
