"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCatalog } from "@/store/CatalogContext";
import { CellIn } from "@/components/motion/motion";
import FadeImage from "@/components/FadeImage";

export default function Categories() {
  const { products, categories, status, error } = useCatalog();
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

      <div className="container-x mx-auto hidden max-w-6xl items-end justify-between gap-8 py-10 md:flex">
        <div>
          <p className="label-mono">{categories.length} departments</p>
          <h1 className="mt-2 text-3xl font-semibold">Category</h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Find your next everyday layer, pair, bag, or finishing detail.
        </p>
      </div>

      <div className="container-x mx-auto max-w-6xl pb-12 pt-6 md:pt-0">
        {status === "loading" ? (
          <p role="status" className="py-12 text-center text-sm text-muted-foreground">
            Loading categories…
          </p>
        ) : status === "error" ? (
          <p role="alert" className="py-12 text-center text-sm text-destructive">
            {error ?? "The store catalog could not be loaded. Please try again."}
          </p>
        ) : categories.length === 0 ? (
          <div
            role="status"
            className="rounded-2xl border border-dashed border-border py-20 text-center"
          >
            <p className="font-display text-2xl font-light">No categories are available.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const count = products.filter((product) => product.category === category.slug).length;
              return (
                <CellIn key={category.slug} index={index} className="h-full">
                  <Link
                    href={`/categories/${category.slug}`}
                    className="group relative flex h-40 items-stretch overflow-hidden rounded-3xl bg-gray-100"
                  >
                    <div className="relative z-10 flex w-[54%] flex-col justify-center px-5 py-4">
                      <h2 className="text-xl font-semibold leading-tight">{category.name}</h2>
                      <p className="mt-1.5 line-clamp-2 max-w-[150px] text-sm leading-tight text-muted-foreground">
                        {category.tagline}
                      </p>
                      <span className="mt-3 inline-flex w-fit rounded-full bg-white px-2.5 py-1 text-[11px] font-medium">
                        {count} {count === 1 ? "Product" : "Products"}
                      </span>
                    </div>
                    <FadeImage
                      src={category.image}
                      alt={category.name}
                      eager={index === 0}
                      sizes="(max-width: 767px) 54vw, (max-width: 1023px) 27vw, 18vw"
                      className="absolute inset-y-0 right-0 w-[54%] bg-transparent"
                      imgClassName="object-contain object-right p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                </CellIn>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
