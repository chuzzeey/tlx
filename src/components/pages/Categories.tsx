"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { categoryIndexCategories, productsByCategory } from "@/data/catalog";
import { PageHeader } from "@/components/ProductCard";
import { CellIn } from "@/components/motion/motion";
import FadeImage from "@/components/FadeImage";
import { Footnote } from "@/components/Ornaments";

export default function Categories() {
  return (
    <main>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-center border-b border-border bg-background md:hidden">
        <Link
          href="/"
          aria-label="Back to home"
          className="absolute left-3 flex h-11 w-11 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-sm font-semibold">Category</h1>
      </div>

      <div className="hidden md:block">
        <PageHeader
          kicker={`${categoryIndexCategories.length} categories`}
          title="Browse categories."
          lede="Explore the collections, from considered homeware to everyday apparel."
        />
      </div>

      <div className="container-x pb-24 pt-6 md:py-14">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categoryIndexCategories.map((category, index) => {
            const count = productsByCategory(category.slug).length;
            return (
              <CellIn key={category.slug} index={index} className="h-full">
                <Link
                  href={`/categories/${category.slug}`}
                  className="group relative flex h-40 items-stretch overflow-hidden rounded-3xl bg-neutral-100 transition-colors hover:bg-neutral-200 dark:bg-muted dark:hover:bg-muted/80 md:h-auto md:flex-col md:rounded-2xl md:border md:border-border"
                >
                  <div className="relative z-10 flex w-[54%] flex-col justify-center px-5 py-4 md:order-2 md:w-full md:justify-start md:bg-background md:px-6 md:py-5">
                    <h2 className="text-xl font-semibold leading-tight md:text-2xl">{category.name}</h2>
                    <p className="mt-1.5 line-clamp-2 max-w-[150px] text-sm leading-tight text-muted-foreground md:max-w-none">
                      {category.tagline}
                    </p>
                    <span className="mt-3 inline-flex w-fit rounded-full bg-white px-2.5 py-1 text-[11px] font-medium dark:bg-neutral-900 md:bg-neutral-100 md:dark:bg-muted">
                      {count} {count === 1 ? "Product" : "Products"}
                    </span>
                  </div>
                  <FadeImage
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-y-0 right-0 w-[54%] bg-transparent md:relative md:order-1 md:inset-auto md:w-full md:aspect-[3/2]"
                    imgClassName="object-contain object-right p-2 transition-transform duration-500 group-hover:scale-105 md:object-cover md:p-0"
                  />
                  <ArrowUpRight className="absolute right-5 top-5 z-10 hidden h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground md:block" />
                </Link>
              </CellIn>
            );
          })}
        </div>
        <div className="hidden md:block">
          <Footnote className="mt-8">
            New departments open when the right maker appears — never before.
          </Footnote>
        </div>
      </div>
    </main>
  );
}
