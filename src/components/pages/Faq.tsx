"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Search } from "lucide-react";
import SupportTopBar from "@/components/pages/SupportTopBar";
import { faqs, faqGroups } from "@/data/content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const allQuestions = "All questions";

export default function Faq() {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState(allQuestions);

  const filteredFaqs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesGroup = activeGroup === allQuestions || faq.group === activeGroup;
      const matchesSearch = !search || `${faq.q} ${faq.a}`.toLowerCase().includes(search);
      return matchesGroup && matchesSearch;
    });
  }, [activeGroup, query]);

  const visibleGroups = faqGroups.filter((group) =>
    filteredFaqs.some((faq) => faq.group === group)
  );

  return (
    <main className="pb-20">
      <SupportTopBar title="Frequently asked" backHref="/support" backLabel="Back to help centre" />

      <section className="border-b border-border">
        <div className="container-x mx-auto max-w-6xl pb-8 pt-8 md:pb-10 md:pt-10">
          <Link
            href="/support"
            className="mb-5 hidden items-center gap-2 font-mono2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            Help centre
          </Link>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="label-mono">FAQ / TLX Originals</p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-light tracking-tight sm:text-5xl">
                Answers, without the runaround.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Search by topic, or open a question for the details.
              </p>
            </div>
            <p className="font-mono2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {faqs.length} answers
            </p>
          </div>

          <div className="relative mt-7 max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search frequently asked questions"
              placeholder="Try “delivery”, “fit”, or “return”"
              className="h-12 w-full rounded-2xl border-0 bg-neutral-100 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring dark:bg-neutral-900"
            />
          </div>
        </div>
      </section>

      <div className="container-x mx-auto max-w-6xl py-7 sm:py-10">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {[allQuestions, ...faqGroups].map((group) => {
            const count = group === allQuestions
              ? faqs.length
              : faqs.filter((faq) => faq.group === group).length;
            const active = activeGroup === group;

            return (
              <button
                key={group}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveGroup(group)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs transition-colors ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {group}
                <span className={active ? "text-background/60" : "text-muted-foreground/70"}>
                  {String(count).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-neutral-100 px-6 py-14 text-center dark:bg-neutral-900">
            <p className="font-display text-2xl font-light">No match for that search.</p>
            <p className="mt-2 text-sm text-muted-foreground">Try a shorter phrase or message our team.</p>
            <Link href="/support/contact" className="btn-outline-invert mt-6 rounded-full">
              Contact us
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {visibleGroups.map((group) => {
              const groupFaqs = filteredFaqs.filter((faq) => faq.group === group);

              return (
                <section key={group}>
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">{group}</h2>
                    <span className="font-mono2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {String(groupFaqs.length).padStart(2, "0")} answers
                    </span>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {groupFaqs.map((faq, index) => (
                      <AccordionItem
                        key={faq.q}
                        value={`${group}-${faq.q}`}
                        className="overflow-hidden rounded-2xl border border-border bg-card px-4 sm:px-5"
                      >
                        <AccordionTrigger className="gap-4 py-5 text-left text-sm font-medium hover:no-underline sm:text-base">
                          <span className="flex min-w-0 items-start gap-4">
                            <span className="pt-0.5 font-mono2 text-[10px] text-muted-foreground">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span>{faq.q}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-5 pl-8 text-sm leading-7 text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })}
          </div>
        )}

        <section className="mt-12 flex flex-col gap-5 rounded-3xl bg-foreground p-6 text-background sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-mono2 text-[10px] uppercase tracking-[0.16em] text-background/60">
              Still need us?
            </p>
            <h2 className="mt-2 font-display text-2xl font-light">Talk to a person.</h2>
            <p className="mt-2 text-sm text-background/70">WhatsApp or call +234 802 904 1081.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://wa.me/2348029041081"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-3 text-xs font-medium text-foreground transition-opacity hover:opacity-85"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <Link
              href="/support/contact"
              className="inline-flex items-center gap-2 rounded-full border border-background/30 px-4 py-3 text-xs text-background transition-colors hover:bg-background/10"
            >
              Send a message
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
