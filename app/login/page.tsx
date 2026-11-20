import type { Metadata } from "next";
import Login from "@/components/pages/Login";

export const metadata: Metadata = {
  title: "Login Account",
  description: "Sign in to your TLX Originals account.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Login />;
}
