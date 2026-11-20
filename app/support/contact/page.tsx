import type { Metadata } from "next";
import Contact from "@/components/pages/Contact";

export const metadata: Metadata = {
  title: "Contact TLX Originals",
  description:
    "Questions about an order, a product, or sizing? Contact TLX Originals by WhatsApp, phone, or message.",
  alternates: { canonical: "/support/contact" },
};

export default function Page() {
  return <Contact />;
}
