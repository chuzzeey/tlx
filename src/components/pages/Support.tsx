"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  MessageCircle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import SupportTopBar from "@/components/pages/SupportTopBar";
import { orders, orderTotal } from "@/data/account";
import { formatPrice } from "@/data/catalog";

const helpLinks = [
  {
    to: "/orders",
    label: "Orders",
    title: "Track an order",
    detail: "Check its status, items, and delivery details.",
  },
  {
    to: "/support/faq",
    label: "Product & fit",
    title: "Browse common questions",
    detail: "Product details, sizing, shipping, and payment.",
  },
  {
    to: "/support/returns",
    label: "Returns",
    title: "Read the returns guide",
    detail: "Review the process and start a request.",
  },
];

export default function Support() {
  const [orderNo, setOrderNo] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const lookup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const order = orders.find((item) => item.id.toLowerCase() === orderNo.trim().toLowerCase());
    if (!order) {
      setResult(null);
      toast.error("Order not found", { description: "Check the number and try again." });
      return;
    }

    setResult(
      `${order.id} — ${order.status}. ${order.items.length} item${order.items.length === 1 ? "" : "s"}, total ${formatPrice(orderTotal(order))}, shipping to ${order.address}.`
    );
  };

  return (
    <main className="pb-20">
      <SupportTopBar title="Help centre" backHref="/" backLabel="Back to store" />

      <section className="border-b border-border">
        <div className="container-x mx-auto max-w-6xl pb-9 pt-8 md:pb-12 md:pt-10">
          <div className="mb-4 hidden md:block">
            <p className="label-mono">Orders, fit, returns</p>
            <h1 className="mt-2 text-3xl font-semibold">Help centre</h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Order updates, product fit, delivery, and returns, with direct contact if you need more help.
          </p>
        </div>
      </section>

      <div className="container-x mx-auto max-w-6xl py-7 sm:py-10">
        <nav aria-label="Help topics">
          <div className="divide-y divide-border border-y border-border">
            {helpLinks.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className="group grid grid-cols-[1fr_auto] items-center gap-5 py-5 sm:py-6"
            >
              <span>
                <span className="label-mono">{item.label}</span>
                <span className="mt-1 block font-display text-xl font-light tracking-tight sm:text-2xl">
                  {item.title}
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                  {item.detail}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            ))}
          </div>
        </nav>

        <section className="grid gap-6 border-b border-border py-8 md:grid-cols-[0.85fr_1.15fr] md:gap-10">
          <div>
            <p className="label-mono">Order lookup</p>
            <h2 className="mt-2 font-display text-2xl font-light tracking-tight sm:text-3xl">
              Looking for an update?
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Enter your order number to check its latest status.
            </p>
          </div>
          <div>
            <form onSubmit={lookup} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={orderNo}
                onChange={(event) => setOrderNo(event.target.value)}
                placeholder="Order number"
                aria-label="Order number"
                className="input-plain min-w-0 flex-1 rounded-2xl bg-background"
              />
              <button type="submit" className="btn-solid-invert rounded-2xl px-5">
                Check status
              </button>
            </form>
            {result ? (
              <p aria-live="polite" className="mt-4 border-t border-border pt-4 text-sm leading-6">
                {result}
              </p>
            ) : (
              <p className="mt-3 font-mono2 text-[10px] text-muted-foreground">
                Sample order:{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={() => setOrderNo("TLX-T1O42")}
                >
                  TLX-T1O42
                </button>
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 py-8 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="label-mono">Direct contact</p>
            <h2 className="mt-2 font-display text-2xl font-light tracking-tight">
              Still need us?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Call or message TLX Originals on +234 802 904 1081.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
              <a
                href="https://wa.me/2348029041081"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
              <a
                href="tel:+2348029041081"
                className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call
              </a>
            <Link
              href="/support/contact"
              className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4"
            >
              Send a message <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
