import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Next.js route metadata remains valid even though this page redirects before rendering.
// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "Your Account",
  description: "Orders, addresses and settings for your TLX Originals account.",
  robots: { index: false, follow: false },
};

export default function Page() {
  redirect("/login");
}
