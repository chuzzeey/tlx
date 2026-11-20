import type { Metadata } from "next";
import Products from "@/components/pages/Products";
import JsonLd from "@/components/JsonLd";
import { products } from "@/data/catalog";
import { collectionJsonLd, SITE_NAME } from "@/lib/seo";

const title = "Store";
const description =
  "Browse a considered mix of TLX Originals jackets, T-shirts, shoes, bags, and accessories.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/products" },
  openGraph: { title: `${title} — ${SITE_NAME}`, description, images: ["/images/products/stussy-jacket.png"] },
};

export default function Page() {
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
