# TLX Originals
                   
Live : [https://kimi-k3-ecommerce-storefront.vercel.app/](https://kimi-k3-ecommerce-storefront.vercel.app/)

           


![live](screenshots/1.png)
          

![live](screenshots/2.png)
        

![live](screenshots/3.png)
              
               
![live](screenshots/4.png)
             
              
![live](screenshots/5.png)
            
         
A small ecommerce storefront for considered apparel and handcrafted home goods. Built as a fully server-rendered **Next.js 16** app with a complete SEO layer and a local-first shopping bag.

## Tech stack

- **Next.js 16.3** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS 3.4** with a custom design-token theme (light + dark)
- **Framer Motion 13** for page transitions and scroll reveals
- **next/image** for AVIF/WebP responsive images, **next/font** for Fraunces brand lettering, with system fonts throughout the interface
- **Radix UI / shadcn-style** primitives, **sonner** toasts, **cmdk** command palette, **lucide-react** icons
- The storefront starts from a built-in catalog. When Supabase is configured, its published products and approved reviews become the live storefront source; bag, wishlist, and recently-viewed data remain browser-local.

## Getting started

```bash
npm install
npm run dev      # develop at http://localhost:3000
npm run build    # production build (standalone output)
npm start        # serve the production build
```

### Admin dashboard

The dashboard is integrated at `/dashboard` and uses Supabase Auth. Configure
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `ADMIN_EMAILS` in `.env.local`,
then restart the app. Only the allowlisted Supabase Auth email can access admin routes. Admin sign-up
is disabled; create the permitted user in Supabase Dashboard → Authentication → Users, set an email
and password, and confirm the email. Add that same email to `ADMIN_EMAILS`. The sign-in page accepts
only those Supabase Auth email/password credentials; public sign-up is not exposed.

The TLX product admin uses the shared Supabase catalog. Set `ADMIN_EMAILS` to the permitted Supabase
Auth email address(es), configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
the server-only `SUPABASE_SERVICE_ROLE_KEY`, then run
[`supabase/migrations/20261121000000_tlx_store_catalog.sql`](./supabase/migrations/20261121000000_tlx_store_catalog.sql)
and then
[`supabase/migrations/20261122000000_tlx_product_availability_remove_sku.sql`](./supabase/migrations/20261122000000_tlx_product_availability_remove_sku.sql)
and then
[`supabase/migrations/20261122000001_tlx_ngn_canonical_pricing.sql`](./supabase/migrations/20261122000001_tlx_ngn_canonical_pricing.sql)
in the Supabase SQL Editor, in that order. Run them once before deploying the updated pricing code:
the second migration preserves stored inventory counts, adds a separate availability flag, removes
SKU, and reports unavailable items with zero public stock; the third converts existing catalog prices
to NGN, matching their current storefront prices. New prices are entered and stored directly in NGN.

Before removing the legacy main-image columns, run `npm run migrate:product-images`. This copies each
existing image from its local `/images/products/` asset or current Supabase Storage URL to
`tlx-products/{productId}/main` and verifies the uploaded object. It requires the Supabase URL and
server-only service-role key. Do not apply
[`supabase/migrations/20261123000000_tlx_product_main_image_storage.sql`](./supabase/migrations/20261123000000_tlx_product_main_image_storage.sql)
until the copy command completes successfully; that migration drops `products.image` and
`products.image_alt` and rebuilds `store_products` without either column. Afterward, the main-image
URL is derived from the product ID and the product name is used as its alt text.

Then apply
[`supabase/migrations/20261124000000_tlx_live_product_images.sql`](./supabase/migrations/20261124000000_tlx_live_product_images.sql).
It records each product's image storage path and enables Supabase Realtime for product changes.
Dashboard image uploads use short-lived signed upload tokens to send files directly to Supabase
Storage; each replacement gets a unique URL so cached storefront images update immediately after
the product is saved. Published catalog changes are pushed to connected storefronts without a
refresh. Draft products remain hidden until published.

Seed built-in products with `npm run seed:catalog` (also requires the URL and service-role key). The
seed uploads main images to deterministic storage paths and inserts only missing products; it does
not overwrite existing catalog entries. Product ratings and counts in Supabase mode are calculated only from approved database
reviews, and the dashboard provides review moderation. Existing sample reviews and browser-local
reviews are not imported. Product listing, detail, category, search, cart, and sitemap reads use the
published catalog. Orders are not persisted by the storefront, so revenue and order analytics remain
unavailable until an order system is connected. Admin sign-up is disabled; only the configured admin
email allowlist can use `/dashboard`.

### Docker

```bash
docker build -t aurelle .
docker run -p 3000:3000 aurelle
```

The Dockerfile is a three-stage build producing a minimal standalone server (`server.js`) on port 3000.

## Pages

Public product and category listings, product details, and the sitemap are rendered from the live
catalog on request when Supabase is configured. Other editorial and account content remains static.

| Route | Page | What's on it |
|---|---|---|
| `/` | Home | Four popular-product tiles above the jacket collection, with style filters, ratings, and wishlist actions |
| `/products` | Shop index | Published catalog with category filtering, sorting, and grid/list presentation |
| `/products/[productId]` | Product detail | Live product fields, stock, price, images, approved reviews, related products, and breadcrumb |
| `/categories` | Category index | Store departments with imagery, taglines, and live product counts |
| `/categories/[categoryId]` | Category detail | Category hero with description, filtered product grid, breadcrumb |
| `/content` | Journal | Editorial index — 12 essays with tags, read times, and imagery |
| `/content/[postId]` | Essay | Long-form article with drop cap, pull quotes, author line, and a **Shop the story** rail of the products featured in the piece |
| `/support/faq` | FAQ | Grouped accordion of common questions (orders, shipping, returns, care) |
| `/cart` | Bag | Line items with quantity steppers and remove, order summary (subtotal, shipping, tax), free-shipping progress hint (complimentary over ₦203,106), empty state |
| `/checkout` | Checkout | Four-step flow — Information → Delivery → Payment → Review — with progress indicator, validation, and an order-confirmation screen with barcode |
| `/account` | Account | Tabbed profile: orders with expandable line detail, saved addresses, profile details |
| `/wishlist` | Wishlist | Saved pieces with move-to-bag actions and empty state |

## Features

### Commerce

- **Shopping bag** — add from any product card or detail page, adjust quantities, remove lines; totals computed live with a ₦203,106 free-shipping threshold and tax
- **Wishlist** — one-tap save/unsave everywhere a product appears
- **Recently viewed trail** — product visits are recorded and resurfaced
- **Mock checkout** — full multi-step flow ending in a confirmed order id; orders and account data remain fixtures in `src/data/account.ts`

### Experience

- **Command palette search** — `⌘K` / `Ctrl+K` (or the search icon) opens instant search across products, categories, and essays
- **Light/dark theme** — signed-in Supabase users save their choice to their account for cross-device sync; anonymous visitors keep a browser-specific preference
- **Motion** — enter transitions per route (`app/template.tsx`), scroll-triggered reveals, item-level (never grid-level) stagger animations, image fade-ins with pulse placeholders and a hydration-safe load hook
- **Details** — barcodes, ornaments, drop caps, system-font interface typography, branded serif lettering, generous hairline rules
- **Hydration-safe persistence** — bag/wishlist/trail load after mount and pages render skeletons until ready, so server and client HTML always match
- Toasts for bag/wishlist actions; keyboard- and screen-reader-friendly primitives throughout

### SEO

- **Per-page metadata** — unique titles (`"%s — TLX Originals"` template), descriptions, canonical URLs, Open Graph and Twitter cards with images; article pages use `og:type="article"` with publish dates and authors
- Set `NEXT_PUBLIC_SITE_URL` to the production origin; the default is `http://localhost:3000` for local development
- **Structured data (JSON-LD)** — Product (offers, price, availability, aggregate rating), Article, FAQPage, CollectionPage + ItemList, BreadcrumbList, Organization + WebSite
- **Discovery** — `sitemap.xml` covering every public route, `robots.txt` referencing it
- **Noindex** on bag, checkout, account, and wishlist so thin/private pages stay out of search results
- **Performance as SEO** — responsive AVIF/WebP images with priority loading above the fold, self-hosted variable fonts with no layout shift, full static pre-rendering
- Site URL lives in one place (`SITE_URL` in `src/lib/seo.ts`) — change it when deploying to a real domain

## Project structure

```
app/                        # App Router: routes, layout, template, sitemap, robots, icon
  layout.tsx                #   fonts, global metadata, theme script, providers
  template.tsx              #   per-route enter transition
  products/[productId]/     #   generateStaticParams + generateMetadata + JSON-LD
  ...                       #   one thin server wrapper per route
src/
  components/pages/         # client page bodies (rendered by the route wrappers)
  components/               # Header, Footer, SearchPalette, ProductCard, FadeImage, JsonLd, ornaments
  components/motion/        # reveal/motion primitives
  store/                    # ShopContext (bag, wishlist, trail), ThemeContext
  data/                     # built-in catalog, categories, editorial and account fixtures
                            # content.ts (12 posts, FAQs, shop-the-story map),
                            # account.ts (orders, addresses, profile)
  lib/seo.ts                # site config + all JSON-LD builders
  hooks/                    # use-image-loaded (SSR-safe image load state)
public/images/              # generated imagery: products, categories, posts, hero
```

## Notes

- **Supabase is optional until configured** — without it, the storefront uses its built-in catalog and the admin shows setup guidance. With it, admin product edits and approved review ratings are shared with the storefront.
- **Orders and customer accounts are still fixtures** — the bag, wishlist, and browsing trail are browser-local, and checkout does not process payments or persist orders.
- **NGN price display** — mock catalog values are displayed in naira using a fixed rate of 1 USD = ₦1,354.04 (snapshot from 2026-11-19); refresh the rate and real catalog prices before production.
- Journal, account, and checkout content remain illustrative starter data.
