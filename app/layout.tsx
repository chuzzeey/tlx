import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
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
  icons: {
    icon: [
      {
        url: "https://res.cloudinary.com/nygp3wws/image/upload/v1795157566/PHOTO-2026-11-20-07-52-07.jpg",
        type: "image/jpeg",
      },
    ],
  },
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
  themeColor: "#FFFFFF",
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
        <Providers>
          <StorefrontChrome>{children}</StorefrontChrome>
        </Providers>
        <JsonLd data={organizationJsonLd()} />
      </body>
    </html>
  );
}
