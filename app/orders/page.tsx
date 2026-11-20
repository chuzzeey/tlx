import type { Metadata } from "next";
import Orders from "@/components/pages/Orders";

export const metadata: Metadata = {
  title: "Order History",
  description: "Track, pay for, and review your TLX Originals orders.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Orders />;
}
