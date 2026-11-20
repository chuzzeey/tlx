import type { Metadata } from "next";
import Faq from "@/components/pages/Faq";
import JsonLd from "@/components/JsonLd";
import { faqs } from "@/data/content";
import { faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Shipping, payment, returns, and care. Answers to common TLX Originals customer questions.",
  alternates: { canonical: "/support/faq" },
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <Faq />
    </>
  );
}
