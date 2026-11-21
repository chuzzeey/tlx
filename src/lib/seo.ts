import { categoryName, type Product } from "@/data/catalog";
import type { Post } from "@/data/content";

/** Set NEXT_PUBLIC_SITE_URL to the production origin before deployment. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "TLX Originals";
export const SITE_DESCRIPTION =
  "No Hype. Just Motion! Shop jackets, T-shirts, shoes, bags, and accessories from TLX Originals.";

export const abs = (path: string) => `${SITE_URL}${path}`;

/* ── JSON-LD builders ────────────────────────────────────────────────── */

export function organizationJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+234 802 904 1081",
        contactType: "customer service",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  ];
}

export function productJsonLd(p: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: abs(p.image),
    category: categoryName(p.category),
    brand: { "@type": "Brand", name: SITE_NAME },
    url: abs(`/products/${p.id}`),
    offers: {
      "@type": "Offer",
      url: abs(`/products/${p.id}`),
      priceCurrency: "NGN",
      price: p.price,
      availability:
        (p.inStock ?? p.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: p.rating,
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

export function articleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: abs(post.image),
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: abs(`/content/${post.slug}`),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function collectionJsonLd(
  title: string,
  description: string,
  path: string,
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: abs(path),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: abs(it.url),
      })),
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export type JsonLdData = Record<string, unknown> | Record<string, unknown>[];
