import type { Metadata } from "next";
import Cart from "@/components/pages/Cart";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description: "Review the pieces in your TLX Originals bag and check out. Complimentary shipping terms are shown at checkout.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Cart />;
}
