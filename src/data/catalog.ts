import { formatPrice, legacyUsdPriceToNgn } from "@/lib/currency";
import { catalogVariantDefaults } from "@/lib/product-variants";

export { formatPrice };

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
}

export type AdminCategory = Category & {
  isPublished: boolean;
  productCount: number;
};

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviewCount: number;
  manualReviewCount?: number | null;
  image: string;
  gallery?: string[];
  stock: number;
  inStock?: boolean;
  badge?: "New" | "Bestseller" | "Low stock" | "Sale";
  sizes?: string[];
  featured?: boolean;
}

export const categories: Category[] = [
  { slug: "jackets", name: "Jackets", tagline: "Layers for every day", description: "Everyday outerwear, from statement jackets to relaxed bombers.", image: "/images/products/stussy-jacket.png" },
  { slug: "apparel", name: "T-Shirts", tagline: "Casual essentials", description: "Distinctive everyday clothing from independent labels, made for easy layering and self-expression.", image: "/images/products/chaotic-club-spooky.png" },
  { slug: "shoes", name: "Shoes", tagline: "Made to move", description: "Comfortable everyday footwear with considered materials and distinctive details.", image: "/images/products/sneakers.png" },
  { slug: "bags", name: "Bags", tagline: "Carry your day", description: "Practical carryalls with thoughtful shapes and details for everyday use.", image: "/images/products/pearl-seashell-bag.png" },
  { slug: "accessories", name: "Accessories", tagline: "The finishing details", description: "Useful finishing pieces designed to bring character to everyday outfits.", image: "/images/products/mens-golf-cap.png" },
];

export const categoryIndexCategories = ["jackets", "apparel", "shoes", "bags", "accessories"]
  .map((slug) => categories.find((category) => category.slug === slug))
  .filter((category): category is Category => category !== undefined);

export const popularItems = [
  { name: "Chaotic Club", image: "/images/products/chaotic-club-spooky.png", href: "/products/chaotic-club" },
  { name: "Sneakers", image: "/images/products/sneakers.png", href: "/products/sneakers" },
  { name: "Seashell Bag", image: "/images/products/pearl-seashell-bag.png", href: "/products/seashell-bag" },
  { name: "Men's Golf Cap", image: "/images/products/mens-golf-cap.png", href: "/products/mens-golf-cap" },
];

const legacyUsdProductCatalog: Product[] = [
  {
    id: "terra-vessel-vase", name: "Terra Vessel Vase", category: "ceramics",
    price: 86, rating: 4.8, reviewCount: 34, image: "/images/products/vase-01.webp",
    stock: 14, badge: "Bestseller", featured: true,
  },
  {
    id: "kiln-speckle-mugs", name: "Kiln Speckle Espresso Mugs, Pair", category: "ceramics",
    price: 48, rating: 4.9, reviewCount: 57, image: "/images/products/mugs.webp",
    stock: 22, badge: "Bestseller", featured: true,
  },
  {
    id: "kumo-lantern-lamp", name: "Kumo Paper Lantern Floor Lamp", category: "lighting",
    price: 240, compareAt: 290, rating: 4.7, reviewCount: 21, image: "/images/products/lantern-lamp.webp",
    stock: 6, badge: "Sale", featured: true,
  },
  {
    id: "dome-brass-lamp", name: "Dome Brass Table Lamp", category: "lighting",
    price: 185, rating: 4.6, reviewCount: 18, image: "/images/products/brass-lamp.webp",
    stock: 11, badge: "New",
  },
  {
    id: "oat-merino-throw", name: "Oat Merino Throw", category: "textiles",
    price: 145, rating: 4.9, reviewCount: 63, image: "/images/products/wool-throw.webp",
    stock: 9, badge: "Bestseller", featured: true,
  },
  {
    id: "sage-linen-cushion", name: "Sage Stonewashed Linen Cushion", category: "textiles",
    price: 58, rating: 4.5, reviewCount: 12, image: "/images/products/linen-cushion.webp",
    stock: 30,
  },
  {
    id: "walnut-serving-board", name: "Walnut Serving Board", category: "kitchen",
    price: 72, rating: 4.8, reviewCount: 41, image: "/images/products/walnut-board.webp",
    stock: 17, featured: true,
  },
  {
    id: "reactive-dinner-plates", name: "Reactive Glaze Dinner Plates, Set of 4", category: "kitchen",
    price: 120, rating: 4.7, reviewCount: 29, image: "/images/products/dinner-plates.webp",
    stock: 13, badge: "New",
  },
  {
    id: "glass-bedside-carafe", name: "Glass Bedside Carafe & Tumbler", category: "kitchen",
    price: 58, rating: 4.6, reviewCount: 15, image: "/images/products/carafe.webp",
    stock: 25,
  },
  {
    id: "tripod-oak-side-table", name: "Tripod Oak Side Table", category: "furniture",
    price: 310, rating: 4.8, reviewCount: 19, image: "/images/products/oak-side-table.webp",
    stock: 7, badge: "Low stock", featured: true,
  },
  {
    id: "boucle-lounge-chair", name: "Boucle Lounge Chair", category: "furniture",
    price: 890, compareAt: 1050, rating: 4.9, reviewCount: 26, image: "/images/products/boucle-chair.webp",
    stock: 4, badge: "Sale", featured: true,
  },
  {
    id: "travertine-bookends", name: "Travertine Bookends, Pair", category: "decor",
    price: 95, rating: 4.7, reviewCount: 16, image: "/images/products/bookends.webp",
    stock: 12, badge: "New",
  },
  {
    id: "smoked-amber-vase", name: "Smoked Amber Glass Vase", category: "decor",
    price: 110, rating: 4.6, reviewCount: 11, image: "/images/products/amber-vase.webp",
    stock: 8,
  },
  {
    id: "hinoki-bath-stool", name: "Hinoki Bath Stool", category: "bath",
    price: 165, rating: 4.9, reviewCount: 22, image: "/images/products/bath-stool.webp",
    stock: 10, badge: "Bestseller",
  },
  {
    id: "waffle-towel-set", name: "Waffle Weave Towels, Set of 3", category: "bath",
    price: 78, rating: 4.7, reviewCount: 38, image: "/images/products/waffle-towels.webp",
    stock: 19, featured: true,
  },
  {
    id: "embers-cedar-candle", name: "Embers & Cedar Candle", category: "fragrance",
    price: 52, rating: 4.8, reviewCount: 71, image: "/images/products/candle.webp",
    stock: 28, badge: "Bestseller", featured: true,
  },
  {
    id: "amber-reed-diffuser", name: "Amber Reed Diffuser", category: "fragrance",
    price: 64, rating: 4.5, reviewCount: 14, image: "/images/products/diffuser.webp",
    stock: 16,
  },
  {
    id: "linen-notebook-trio", name: "Linen-Bound Notebooks, Set of 3", category: "stationery",
    price: 36, rating: 4.6, reviewCount: 25, image: "/images/products/notebooks.webp",
    stock: 40,
  },
  {
    id: "brass-pen-tray", name: "Solid Brass Pen & Leather Tray", category: "stationery",
    price: 88, rating: 4.7, reviewCount: 9, image: "/images/products/brass-pen.webp",
    stock: 15, badge: "New",
  },
  {
    id: "terracotta-planter-trio", name: "Terracotta Planter Trio", category: "garden",
    price: 54, rating: 4.6, reviewCount: 31, image: "/images/products/planters.webp",
    stock: 21, badge: "Bestseller",
  },
  {
    id: "steel-watering-can", name: "Steel Indoor Watering Can", category: "garden",
    price: 62, rating: 4.7, reviewCount: 18, image: "/images/products/watering-can.webp",
    stock: 13,
  },
  {
    id: "seagrass-basket-pair", name: "Seagrass Baskets, Set of 2", category: "storage",
    price: 70, rating: 4.5, reviewCount: 20, image: "/images/products/baskets.webp",
    stock: 18,
  },
  {
    id: "modular-oak-shelf", name: "Modular Oak Wall Shelf", category: "storage",
    price: 135, rating: 4.8, reviewCount: 13, image: "/images/products/wall-shelf.webp",
    stock: 9, badge: "Low stock",
  },
  {
    id: "matte-black-cutlery", name: "Matte Black Cutlery, 16 Pieces", category: "tableware",
    price: 140, rating: 4.6, reviewCount: 24, image: "/images/products/cutlery.webp",
    stock: 12, badge: "New", featured: true,
  },
  {
    id: "mouthblown-wine-glasses", name: "Mouth-Blown Wine Glasses, Pair", category: "tableware",
    price: 76, rating: 4.9, reviewCount: 33, image: "/images/products/wine-glasses.webp",
    stock: 15, badge: "Bestseller",
  },
  {
    id: "stussy-jacket", name: "Stussy Jacket", category: "jackets",
    price: 234, rating: 4.9, reviewCount: 5231, image: "/images/products/stussy-jacket.png",
    stock: 18, badge: "Bestseller", featured: true,
  },
  {
    id: "mwdbl-jacket", name: "MWDBL Jacket", category: "jackets",
    price: 228, rating: 4.8, reviewCount: 4928, image: "/images/products/mwdbl-jacket.png",
    stock: 16, badge: "New", featured: true,
  },
  {
    id: "chaotic-club", name: "Chaotic Club", category: "apparel",
    price: 88, rating: 4.8, reviewCount: 216, image: "/images/products/chaotic-club-spooky.png",
    gallery: ["/images/products/stussy-jacket.png", "/images/products/mwdbl-jacket.png"],
    stock: 24, badge: "New",
  },
  {
    id: "sneakers", name: "Sneakers", category: "shoes",
    price: 120, rating: 4.7, reviewCount: 184, image: "/images/products/sneakers.png",
    gallery: ["/images/products/bucket-hat.jpg", "/images/products/chaotic-club-spooky.png"],
    ...catalogVariantDefaults.sneakers,
    stock: 32, badge: "Bestseller",
  },
  {
    id: "seashell-bag", name: "Seashell Bag", category: "bags",
    price: 95, rating: 4.9, reviewCount: 93, image: "/images/products/pearl-seashell-bag.png",
    gallery: ["/images/products/baskets.webp", "/images/products/bucket-hat.jpg"],
    ...catalogVariantDefaults["seashell-bag"],
    stock: 18, badge: "New",
  },
  {
    id: "mens-golf-cap", name: "Men's Golf Cap", category: "accessories",
    price: 48, rating: 4.6, reviewCount: 71, image: "/images/products/mens-golf-cap.png",
    gallery: ["/images/products/bucket-hat.jpg", "/images/products/mwdbl-jacket.png"],
    stock: 40,
  },
];

type HomepagePreviewSpec = Pick<
  Product,
  "id" | "name" | "category" | "price" | "rating" | "reviewCount" | "image"
> & { sourceId: string };

const legacyUsdHomepagePreviewProducts: Product[] = ([
  {
    sourceId: "stussy-jacket",
    id: "layout-preview-jacket-01",
    name: "Varsity Jacket",
    category: "jackets",
    price: 218,
    rating: 4.8,
    reviewCount: 64,
    image: "/images/products/stussy-jacket.png",
  },
  {
    sourceId: "mwdbl-jacket",
    id: "layout-preview-jacket-02",
    name: "Track Jacket",
    category: "jackets",
    price: 204,
    rating: 4.7,
    reviewCount: 38,
    image: "/images/products/mwdbl-jacket.png",
  },
  {
    sourceId: "chaotic-club",
    id: "layout-preview-apparel-01",
    name: "Graphic Tee",
    category: "apparel",
    price: 82,
    rating: 4.8,
    reviewCount: 46,
    image: "/images/products/chaotic-club-spooky.png",
  },
  {
    sourceId: "chaotic-club",
    id: "layout-preview-apparel-02",
    name: "Studio T-Shirt",
    category: "apparel",
    price: 76,
    rating: 4.6,
    reviewCount: 29,
    image: "/images/products/chaotic-club-spooky.png",
  },
  {
    sourceId: "sneakers",
    id: "layout-preview-shoes-01",
    name: "Court Sneakers",
    category: "shoes",
    price: 118,
    rating: 4.7,
    reviewCount: 52,
    image: "/images/products/sneakers.png",
  },
  {
    sourceId: "sneakers",
    id: "layout-preview-shoes-02",
    name: "Everyday Runners",
    category: "shoes",
    price: 126,
    rating: 4.8,
    reviewCount: 41,
    image: "/images/products/sneakers.png",
  },
  {
    sourceId: "seashell-bag",
    id: "layout-preview-bag-01",
    name: "Daily Crossbody",
    category: "bags",
    price: 88,
    rating: 4.7,
    reviewCount: 35,
    image: "/images/products/pearl-seashell-bag.png",
  },
  {
    sourceId: "seashell-bag",
    id: "layout-preview-bag-02",
    name: "Mini Shoulder Bag",
    category: "bags",
    price: 92,
    rating: 4.8,
    reviewCount: 27,
    image: "/images/products/pearl-seashell-bag.png",
  },
  {
    sourceId: "mens-golf-cap",
    id: "layout-preview-accessory-01",
    name: "Canvas Bucket Hat",
    category: "accessories",
    price: 38,
    rating: 4.6,
    reviewCount: 22,
    image: "/images/products/bucket-hat.jpg",
  },
  {
    sourceId: "mens-golf-cap",
    id: "layout-preview-accessory-02",
    name: "Classic Panel Cap",
    category: "accessories",
    price: 44,
    rating: 4.7,
    reviewCount: 31,
    image: "/images/products/mens-golf-cap.png",
  },
 ] satisfies HomepagePreviewSpec[]).map(({ sourceId, ...preview }) => {
  const source = legacyUsdProductCatalog.find((product) => product.id === sourceId);
  if (!source) throw new Error(`Missing homepage preview source product: ${sourceId}`);

  return {
    ...source,
    ...preview,
    badge: "New" as const,
  };
});

const availableProductIds = new Set([
  "stussy-jacket",
  "mwdbl-jacket",
  "chaotic-club",
  "sneakers",
  "seashell-bag",
  "mens-golf-cap",
]);

const legacyUsdProducts = [
  ...legacyUsdProductCatalog.filter((product) => availableProductIds.has(product.id)),
  ...(process.env.NODE_ENV === "development" ? legacyUsdHomepagePreviewProducts : []),
];

export const products: Product[] = legacyUsdProducts.map((product) => ({
  ...product,
  price: legacyUsdPriceToNgn(product.price),
  ...(product.compareAt == null ? {} : { compareAt: legacyUsdPriceToNgn(product.compareAt) }),
}));

export interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
  sample?: boolean;
}

type ReviewSeed = Omit<Review, "id" | "verified" | "sample">;

const reviewSeeds: Record<string, ReviewSeed[]> = {
  "stussy-jacket": [
    { author: "Maya R.", location: "Lagos", rating: 5, date: "2026-11-08", title: "An easy layer", body: "Fits over a tee or light knit without feeling bulky. The blue has a little more depth in person." },
    { author: "T. A.", location: "Abuja", rating: 4, date: "2026-10-25", title: "Good fit, long sleeves", body: "The body fits true to size; the cuffs cover more of my hands than expected. Still reaching for it most days." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-14", title: "Better than expected", body: "Light enough to wear indoors but holds its shape outside. The pockets are actually useful." },
    { author: "Nneka O.", location: "Port Harcourt", rating: 5, date: "2026-10-02", title: "A solid everyday piece", body: "The relaxed cut works with jeans and smarter trousers. It feels considered without trying too hard." },
    { author: "J. K.", location: "", rating: 4, date: "2026-09-21", title: "Just check the size guide", body: "I usually take a medium and could have gone down one. The fabric and finish are both lovely." },
    { author: "Ibrahim S.", location: "Kaduna", rating: 3, date: "2026-09-09", title: "One small zip snag", body: "The zipper caught the lining once or twice at first. It has settled down, and the jacket itself is comfortable." },
    { author: "Anonymous", location: "", rating: 4, date: "2026-08-28", title: "Wearing it more than planned", body: "The collar sits well and it is not too warm for a mild day. A dependable grab-and-go layer." },
    { author: "Dara E.", location: "Lagos", rating: 5, date: "2026-08-16", title: "A good gift", body: "Bought this for my brother. He liked the understated details and has worn it every time we have met since." },
  ],
  "mwdbl-jacket": [
    { author: "Kelechi M.", location: "Lagos", rating: 5, date: "2026-11-06", title: "The fit is the best part", body: "Room through the shoulders without looking oversized. I can layer a hoodie underneath comfortably." },
    { author: "R. B.", location: "London", rating: 4, date: "2026-10-23", title: "Good jacket for the price", body: "The material feels sturdy and the pockets sit where I need them. Slightly heavier than I expected." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-12", title: "A regular in my rotation", body: "Works with most of what I own and still looks neat after a full day out." },
    { author: "Tomi A.", location: "Ibadan", rating: 5, date: "2026-09-30", title: "Nice details up close", body: "The stitching and hardware feel well finished. It looks simple from a distance, which I like." },
    { author: "F. O.", location: "", rating: 4, date: "2026-09-18", title: "Runs a little roomy", body: "I prefer a closer fit, so I would size down next time. The jacket is comfortable and easy to style." },
    { author: "Zainab L.", location: "Abuja", rating: 3, date: "2026-09-05", title: "Good, with a small caveat", body: "The lining took a little while to soften. After a few wears it sits better and feels much more natural." },
    { author: "Anonymous", location: "", rating: 4, date: "2026-08-24", title: "Useful from day one", body: "Warm enough for an evening commute and easy to throw over a shirt. No fuss, which is exactly right." },
    { author: "Emeka N.", location: "Enugu", rating: 5, date: "2026-08-11", title: "Would buy again", body: "The cut is easy and the finish is better than jackets I have paid more for. Delivery was straightforward." },
  ],
  "chaotic-club": [
    { author: "Amara D.", location: "Lagos", rating: 5, date: "2026-11-04", title: "The print has personality", body: "The graphic is bold without taking over the whole outfit. The cotton feels soft after washing." },
    { author: "S. P.", location: "Accra", rating: 4, date: "2026-10-21", title: "A relaxed fit", body: "Loose in the way I hoped. If you like a neater shape, consider sizing down." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-10", title: "Better in person", body: "The colours are a little richer than they look online, and the fabric is comfortable all day." },
    { author: "Chidi O.", location: "Abuja", rating: 5, date: "2026-09-28", title: "Easy to wear", body: "I have worn it with denim and under a jacket. The print still looks good after a gentle wash." },
    { author: "M. J.", location: "", rating: 4, date: "2026-09-16", title: "Check the measurements", body: "The shoulders are intentionally roomy. I measured a shirt I already own and got the size right." },
    { author: "Rita E.", location: "Benin City", rating: 3, date: "2026-09-03", title: "A little thinner than expected", body: "Nice graphic and a comfortable cut, though I expected a heavier tee. Best for layering." },
    { author: "Anonymous", location: "", rating: 4, date: "2026-08-22", title: "A fun everyday tee", body: "The print gets noticed, but the fit is what keeps me wearing it. Nothing scratchy around the neck." },
    { author: "Femi A.", location: "Lagos", rating: 5, date: "2026-08-09", title: "One of my favourites", body: "The shape holds up and the artwork feels distinctive. I would happily pick up another colour." },
  ],
  sneakers: [
    { author: "Oliver P.", location: "Dublin", rating: 3, date: "2026-11-02", title: "Good, not flawless", body: "Lovely pair overall, though mine arrived with a tiny mark on the sole. Support responded within a day and made it right." },
    { author: "Elise V.", location: "Paris", rating: 5, date: "2026-10-19", title: "A comfortable daily pair", body: "They are the shoes I reach for most often. Comfortable on a long walk and easy to wear with simple outfits." },
    { author: "Aisha R.", location: "Toronto", rating: 4, date: "2026-10-08", title: "Slow ship, good shoes", body: "Took nine days to arrive, which tested my patience — but they felt comfortable straight out of the box." },
    { author: "N. C.", location: "", rating: 5, date: "2026-09-26", title: "More comfortable than they look", body: "The sole has enough cushioning for a full day on my feet. They needed almost no breaking in." },
    { author: "Chisom B.", location: "Lagos", rating: 4, date: "2026-09-14", title: "The colour goes with a lot", body: "The blue is subtle in person and works with more outfits than I expected. Sizing felt standard for me." },
    { author: "Anonymous", location: "", rating: 3, date: "2026-09-01", title: "A little narrow at first", body: "The toe box felt snug for the first few wears, then eased up. I would check the size details if you prefer extra room." },
    { author: "M. O.", location: "Bristol", rating: 5, date: "2026-08-20", title: "Good everyday trainers", body: "Light, easy to clean, and comfortable on the walk to work. They have held their shape so far." },
    { author: "Daniel K.", location: "Abuja", rating: 4, date: "2026-08-07", title: "As pictured", body: "The colours and shape match the photos. They feel sturdy without being too heavy." },
  ],
  "seashell-bag": [
    { author: "Leila H.", location: "Beirut", rating: 5, date: "2026-11-01", title: "Small but useful", body: "Fits my phone, card case, keys, and a few small extras. The curved shape sits nicely against the body." },
    { author: "P. N.", location: "", rating: 4, date: "2026-10-18", title: "A lovely colour", body: "The burgundy is rich but still easy to wear. The strap could be a little longer for a heavier coat." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-07", title: "Just enough room", body: "I wanted a bag for essentials rather than everything. The clasp is simple and the lining feels neat." },
    { author: "Ngozi T.", location: "Lagos", rating: 5, date: "2026-09-25", title: "Nice shape, no fuss", body: "It keeps its shape when set down and the finish wipes clean easily. I have used it most weekends." },
    { author: "M. A.", location: "Nairobi", rating: 4, date: "2026-09-12", title: "Good for going out", body: "Light enough to carry all evening. I would not choose it when I need to bring a tablet or a water bottle." },
    { author: "Anonymous", location: "", rating: 3, date: "2026-08-30", title: "The strap took adjusting", body: "It took a couple of tries to find the right strap length, but it stays put now and the bag is comfortable." },
    { author: "Sarah W.", location: "Manchester", rating: 5, date: "2026-08-18", title: "A thoughtful gift", body: "Bought it for my mum and she liked the shape immediately. The packaging was simple and arrived in good condition." },
    { author: "Tunde A.", location: "Ibadan", rating: 4, date: "2026-08-05", title: "Well made for everyday", body: "The stitching looks tidy and the hardware feels solid. It is compact, just as described." },
  ],
  "mens-golf-cap": [
    { author: "Henrik B.", location: "Oslo", rating: 5, date: "2026-10-30", title: "A cap that fits properly", body: "The adjuster gives a secure fit without pressing at the sides. The brim keeps its shape." },
    { author: "J. L.", location: "", rating: 4, date: "2026-10-17", title: "Good for daily wear", body: "Lightweight and comfortable on a warm day. The embroidery is subtle, which suits me." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-06", title: "Exactly what I needed", body: "No stiff crown or oversized logo. It packs easily and still looks tidy when I put it back on." },
    { author: "Ade O.", location: "Lagos", rating: 4, date: "2026-09-24", title: "Nice shape", body: "The curved brim is just right and the cotton feels breathable. I would have liked one more colour option." },
    { author: "M. R.", location: "Dublin", rating: 5, date: "2026-09-11", title: "Simple and comfortable", body: "Bought it for the course but wear it on errands too. The strap is easy to adjust." },
    { author: "Anonymous", location: "", rating: 3, date: "2026-08-29", title: "Runs a touch small", body: "It fits, but there is not much room left on the adjuster for a larger head. The finish is otherwise good." },
    { author: "Kola S.", location: "Abuja", rating: 5, date: "2026-08-17", title: "A good everyday cap", body: "The fabric feels durable and the shape does not collapse after a few wears. Easy to clean by hand." },
    { author: "F. D.", location: "", rating: 4, date: "2026-08-04", title: "Understated in a good way", body: "Comfortable, practical, and without extra branding. It is the one I keep by the door." },
  ],
};

/** Temporary product-specific samples; replace with customer-submitted reviews when available. */
export function reviewsFor(productId: string): Review[] {
  return (reviewSeeds[productId] ?? []).map((review, index) => ({
    ...review,
    id: `${productId}-sample-${index + 1}`,
    verified: false,
    sample: true,
  }));
}

const cardReviewCountOverrides: Record<string, number> = {
  "stussy-jacket": 216,
  "mwdbl-jacket": 184,
};

export function cardReviewCount(product: Product): number {
  return product.manualReviewCount ?? cardReviewCountOverrides[product.id] ?? product.reviewCount;
}

export function productById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function categoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function productsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

export function categoryName(slug: string): string {
  return categoryBySlug(slug)?.name ?? slug;
}

export const FREE_SHIPPING_THRESHOLD_NGN = 203_106;
export const STANDARD_SHIPPING_FEE_NGN = 12_186;
export const EXPRESS_SHIPPING_FEE_NGN = 18_957;
export const WHITE_GLOVE_SHIPPING_FEE_NGN = 66_348;
