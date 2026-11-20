import type { Metadata } from "next";
import Support from "@/components/pages/Support";

export const metadata: Metadata = {
  title: "Help Centre",
  description:
    "Order lookup, shipping, returns, and product care. Find answers or contact TLX Originals on WhatsApp or phone.",
  alternates: { canonical: "/support" },
};

export default function Page() {
  return <Support />;
}
