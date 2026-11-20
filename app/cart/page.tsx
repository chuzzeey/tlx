import type { Metadata } from "next";
import Cart from "@/components/pages/Cart";
import { formatPrice } from "@/data/catalog";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description: `Review the pieces in your TLX Originals bag and check out — complimentary shipping over ${formatPrice(150)}.`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Cart />;
}
