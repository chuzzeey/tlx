import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ProductDetail from "@/components/pages/ProductDetail";
import JsonLd from "@/components/JsonLd";
import { getPublishedCategories, getPublishedProduct } from "@dashboard/lib/catalog-service";
import { breadcrumbJsonLd, productJsonLd, SITE_NAME, SOCIAL_IMAGE } from "@/lib/seo";

type Params = Promise<{ productId: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublishedProduct(productId);
  if (!product) return { title: "Piece Not Found" };
  return {
    title: product.name,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: `${product.name} — ${SITE_NAME}`,
      images: [{ url: SOCIAL_IMAGE, alt: "TLX Originals" }],
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { productId } = await params;
  const product = await getPublishedProduct(productId);
  if (!product) notFound();
  if (product.id !== productId) redirect(`/products/${product.id}`);

  const categories = await getPublishedCategories();
  const cat = categories.find((category) => category.slug === product.category);
  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product, cat?.name ?? product.category),
          breadcrumbJsonLd([
            { name: "Shop", path: "/products" },
            { name: cat?.name ?? product.category, path: `/categories/${product.category}` },
            { name: product.name, path: `/products/${product.id}` },
          ]),
        ]}
      />
      <ProductDetail productId={product.id} initialProduct={product} />
    </>
  );
}
