import type { Metadata } from "next";
import Products from "@/components/pages/Products";
import JsonLd from "@/components/JsonLd";
import { getPublishedCatalog } from "@dashboard/lib/catalog-service";
import { collectionJsonLd, SITE_NAME, SOCIAL_IMAGE } from "@/lib/seo";

const title = "Store";
const description =
  "Browse a considered mix of TLX Originals jackets, T-shirts, shoes, bags, and accessories.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/products" },
  openGraph: { title: `${title} — ${SITE_NAME}`, description, images: [SOCIAL_IMAGE] },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const products = await getPublishedCatalog();
  return (
    <>
      <JsonLd
        data={collectionJsonLd(
          title,
          description,
          "/products",
          products.map((p) => ({ name: p.name, url: `/products/${p.id}` }))
        )}
      />
      <Products />
    </>
  );
}
