"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Phone, Search } from "lucide-react";
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
    <main className="pb-14 md:pb-20">
      <SupportTopBar title="Service notes" backHref="/" backLabel="Back to store" />

      <section className="border-b border-border">
        <div className="container-x mx-auto max-w-6xl pb-8 pt-8 md:pb-11 md:pt-12">
          <div className="max-w-3xl">
            <h1 className="max-w-3xl font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Need a hand?
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Find answers about orders, sizing, delivery, returns and payment.
            </p>
          </div>

          <div className="relative mt-7 max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search frequently asked questions"
              placeholder="Search orders, fit or delivery"
              className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            />
          </div>
        </div>
      </section>

      <div className="container-x mx-auto max-w-6xl">
        <div
          className="-mx-4 flex gap-5 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:gap-7 sm:px-0"
          role="group"
          aria-label="Filter questions"
        >
          {[allQuestions, ...faqGroups].map((group) => {
            const active = activeGroup === group;

            return (
              <button
                key={group}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveGroup(group)}
                className={`shrink-0 border-b-2 py-4 text-xs transition-colors ${
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {group}
              </button>
            );
          })}
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="border-b border-border py-12">
            <p className="font-display text-2xl font-light">No match for that search.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a shorter phrase or reach out to us below.
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-9 sm:mt-9 sm:space-y-12">
            {visibleGroups.map((group) => {
              const groupFaqs = filteredFaqs.filter((faq) => faq.group === group);

              return (
                <section key={group}>
                  <div className="mb-3">
                    <h2 className="font-display text-xl font-light tracking-tight sm:text-2xl">{group}</h2>
                  </div>
                  <Accordion type="single" collapsible className="border-y border-border">
                    {groupFaqs.map((faq) => (
                      <AccordionItem
                        key={faq.q}
                        value={`${group}-${faq.q}`}
                        className="border-border"
                      >
                        <AccordionTrigger className="gap-4 py-4 text-left text-sm font-medium hover:no-underline sm:py-5 sm:text-base">
                          <span className="min-w-0">{faq.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="max-w-3xl pb-5 pl-9 text-sm leading-7 text-muted-foreground sm:pl-10">
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

        <section className="mt-12 flex flex-col gap-5 border-t border-border pt-6 sm:mt-16 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <div>
            <p className="label-mono">Still have a question?</p>
            <h2 className="mt-2 font-display text-2xl font-light tracking-tight">
              We’re one message away.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">+234 802 904 1081</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://wa.me/2348029041081"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-foreground px-5 py-3 text-xs font-medium transition-colors hover:bg-foreground hover:text-background"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href="tel:+2348029041081"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-xs font-medium transition-colors hover:border-foreground"
            >
              <Phone className="h-4 w-4" />
              Call us
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
