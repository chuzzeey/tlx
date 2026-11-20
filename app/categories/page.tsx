import type { Metadata } from "next";
import Categories from "@/components/pages/Categories";
import JsonLd from "@/components/JsonLd";
import { categoryIndexCategories } from "@/data/catalog";
import { collectionJsonLd, SITE_NAME } from "@/lib/seo";

const title = "Categories";
const description =
  "Browse jackets, T-shirts, shoes, bags, and accessories from TLX Originals.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/categories" },
  openGraph: { title: `${title} — ${SITE_NAME}`, description, images: ["/images/products/stussy-jacket.png"] },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={collectionJsonLd(
          "Shop by Category",
          description,
          "/categories",
          categoryIndexCategories.map((category) => ({
            name: category.name,
            url: `/categories/${category.slug}`,
          }))
        )}
      />
      <Categories />
    </>
  );
}
