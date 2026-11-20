import type { Metadata } from "next";
import ContentHub from "@/components/pages/ContentHub";
import JsonLd from "@/components/JsonLd";
import { posts } from "@/data/content";
import { collectionJsonLd, SITE_NAME } from "@/lib/seo";

const title = "The Journal";
const description =
  "Notes on style, movement, and the details behind the TLX Originals collection.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/content" },
  openGraph: { title: `${title} — ${SITE_NAME}`, description, images: ["/images/posts/slow-home.webp"] },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={collectionJsonLd(
          title,
          description,
          "/content",
          posts.map((p) => ({ name: p.title, url: `/content/${p.slug}` }))
        )}
      />
      <ContentHub />
    </>
  );
}
