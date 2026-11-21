import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ProductDetail from "@/components/pages/ProductDetail";
import JsonLd from "@/components/JsonLd";
import { categoryBySlug } from "@/data/catalog";
import { getPublishedProduct } from "@dashboard/lib/catalog-service";
import { breadcrumbJsonLd, productJsonLd, SITE_NAME } from "@/lib/seo";

type Params = Promise<{ productId: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublishedProduct(productId);
  if (!product) return { title: "Piece Not Found" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: `${product.name} — ${SITE_NAME}`,
      description: product.description,
      images: [{ url: product.image, alt: product.name }],
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { productId } = await params;
  const product = await getPublishedProduct(productId);
  if (!product) notFound();
  if (product.id !== productId) redirect(`/products/${product.id}`);

  const cat = categoryBySlug(product.category);
  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product),
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
