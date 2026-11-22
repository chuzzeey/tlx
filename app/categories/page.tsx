import type { Metadata } from "next";
import Categories from "@/components/pages/Categories";
import JsonLd from "@/components/JsonLd";
import { getPublishedCategories } from "@dashboard/lib/catalog-service";
import { collectionJsonLd, SITE_NAME } from "@/lib/seo";

const title = "Categories";
const description =
  "Browse jackets, T-shirts, shoes, bags, and accessories from TLX Originals.";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/categories" },
  openGraph: { title: `${title} — ${SITE_NAME}`, description, images: ["/images/products/stussy-jacket.png"] },
};

export default async function Page() {
  const categories = await getPublishedCategories();
  return (
    <>
      <JsonLd
        data={collectionJsonLd(
          "Shop by Category",
          description,
          "/categories",
          categories.map((category) => ({
            name: category.name,
            url: `/categories/${category.slug}`,
          }))
        )}
      />
      <Categories />
    </>
  );
}
