"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, MessageCircle, Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowDoodle } from "@/components/Ornaments";
import SupportTopBar from "@/components/pages/SupportTopBar";

const topics = ["An existing order", "Product advice", "Returns & exchanges", "Press & wholesale", "Something else"];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", order: "", message: "" });
  const [sent, setSent] = useState(false);
  const [reference, setReference] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email.includes("@") || !form.topic || form.message.length < 10) {
      toast.error("Please complete all required fields", { description: "Message needs at least 10 characters." });
      return;
    }
    setReference(`MSG-${Math.floor(1000 + Math.random() * 9000)}`);
    setSent(true);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <div>
      <SupportTopBar
        title="Talk to TLX Originals"
        backHref="/support"
        backLabel="Back to help centre"
      />
      <div className="border-b border-border">
        <div className="container-x mx-auto max-w-6xl py-7 md:py-10">
          <h1 className="mb-4 hidden text-3xl font-semibold md:block">
            Talk to TLX Originals.
          </h1>
          <p className="max-w-xl text-[15px] leading-6 text-muted-foreground">
            Order questions, product advice, wholesale, press — one inbox, real humans, one business day.
          </p>
        </div>
      </div>

      <div className="container-x mx-auto grid max-w-6xl gap-8 py-8 md:gap-12 md:py-12 lg:grid-cols-[1fr_320px]">
        {sent ? (
          <div className="flex flex-col items-start rounded-2xl border border-border bg-card p-10">
            <span className="flex h-12 w-12 items-center justify-center border border-foreground">
              <Check className="h-5 w-5" />
            </span>
            <h2 className="mt-6 font-display text-3xl font-light">Message received.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Thank you, {form.name.split(" ")[0]}. Your note is with the TLX Originals team — expect a reply at{" "}
              <span className="text-foreground">{form.email}</span> within one business day.
              Reference: <span className="font-mono2 text-foreground">{reference}</span>
            </p>
            <Link href="/products" className="btn-outline-invert mt-8">Continue browsing</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label-mono mb-2 block">Name *</label>
                <input className="input-plain rounded-2xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              </div>
              <div>
                <label className="label-mono mb-2 block">Email *</label>
                <input className="input-plain rounded-2xl" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label-mono mb-2 block">Topic *</label>
                <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
                  <SelectTrigger className="w-full rounded-2xl border-border bg-transparent">
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="label-mono mb-2 block">Order number (optional)</label>
                <input className="input-plain rounded-2xl font-mono2" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} placeholder="TLX-T1O42" />
              </div>
            </div>
            <div>
              <label className="label-mono mb-2 block">Message *</label>
              <textarea
                rows={7}
                className="input-plain rounded-2xl"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us everything — the more detail, the better the answer."
              />
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <button type="submit" className="btn-solid-invert rounded-2xl">Send message</button>
              <div aria-hidden className="flex items-center gap-1 text-muted-foreground">
                <ArrowDoodle className="h-8 w-9 -scale-x-100" />
                <span className="rotate-3 font-mono2 text-[10px] uppercase tracking-[0.15em]">we read everything</span>
              </div>
            </div>
            <p className="font-mono2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              We never share your details. Ever.
            </p>
          </form>
        )}

        <aside className="space-y-px overflow-hidden rounded-2xl border border-border bg-border lg:self-start">
          <div className="bg-background p-6">
            <MessageCircle className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <p className="label-mono mt-3">WhatsApp</p>
            <a
              href="https://wa.me/2348029041081"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium underline underline-offset-4"
            >
              +234 802 904 1081
            </a>
            <p className="mt-1 text-[12px] text-muted-foreground">Message us directly</p>
          </div>
          <div className="bg-background p-6">
            <Phone className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <p className="label-mono mt-3">Phone</p>
            <a href="tel:+2348029041081" className="mt-2 inline-block text-sm font-medium underline underline-offset-4">
              +234 802 904 1081
            </a>
            <p className="mt-1 text-[12px] text-muted-foreground">Call us directly</p>
          </div>
          <div className="bg-foreground p-6 text-background">
            <p className="font-mono2 text-[10px] uppercase tracking-[0.18em]">Need a quick answer?</p>
            <p className="mt-2 text-sm leading-relaxed opacity-80">
              80% of order questions are answered instantly in the <Link href="/support/faq" className="underline">FAQ</Link> —
              shipping, returns and care are all covered there.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
